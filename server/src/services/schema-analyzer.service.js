const { geminiChat } = require('./openai.service');

/**
 * Parses Mongoose, Prisma, or TypeORM schema files into a structured ER schema definition
 * with diagnostic validation (missing indexes, missing inverse references, unbounded arrays).
 */

const normalizeTypeName = (rawType) => {
  if (!rawType) return 'Mixed';
  const clean = rawType.trim();
  if (clean.includes('ObjectId')) return 'ObjectId';
  if (/^String$/i.test(clean)) return 'String';
  if (/^Number$/i.test(clean)) return 'Number';
  if (/^Boolean$/i.test(clean)) return 'Boolean';
  if (/^Date$/i.test(clean)) return 'Date';
  if (/^Buffer$/i.test(clean)) return 'Buffer';
  if (/^Array|\[/i.test(clean)) return 'Array';
  return clean;
};

/**
 * Heuristic/Regex-based extractor for Mongoose schemas
 */
const extractMongooseModelsRegex = (files) => {
  const entities = [];
  const relations = [];

  for (const file of files) {
    const content = file.content || '';
    if (!content.includes('mongoose.Schema') && !content.includes('new Schema') && !content.includes('model(')) {
      continue;
    }

    // Try to extract model name
    let modelName = null;
    const modelMatch = content.match(/mongoose\.model\s*\(\s*['"`]([^'"`]+)['"`]/) ||
                       content.match(/model\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (modelMatch) {
      modelName = modelMatch[1];
    } else {
      // derive from filename e.g. User.js -> User
      const base = file.source.split('/').pop().replace(/\.[jt]sx?$/, '');
      modelName = base.charAt(0).toUpperCase() + base.slice(1);
    }

    const fields = [
      {
        name: '_id',
        type: 'ObjectId',
        isPrimary: true,
        required: true,
        isIndex: true,
      },
    ];

    // Identify schema fields block
    const schemaBlockMatch = content.match(/(?:new\s+(?:mongoose\.)?Schema\s*\(\s*\{)([\s\S]*?)(?:\}\s*,\s*\{|\}\s*\))/);
    const schemaText = schemaBlockMatch ? schemaBlockMatch[1] : content;

    // Scan top-level properties
    const fieldRegex = /^\s*([a-zA-Z0-9_]+)\s*:\s*(\{[\s\S]*?\}|\[[\s\S]*?\]|[a-zA-Z0-9_\.]+)/gm;
    let match;

    while ((match = fieldRegex.exec(schemaText)) !== null) {
      const fieldName = match[1];
      const fieldDef = match[2];

      if (['timestamps', 'toJSON', 'toObject', 'virtuals'].includes(fieldName)) continue;

      let type = 'Mixed';
      let required = false;
      let unique = false;
      let ref = null;
      let isArray = false;
      let isIndex = false;

      if (fieldDef.startsWith('{')) {
        // Parse options
        const typeMatch = fieldDef.match(/type\s*:\s*([^,\n}]+)/);
        if (typeMatch) {
          type = typeMatch[1].replace(/mongoose\.Schema\.Types\./g, '').replace(/Schema\.Types\./g, '').trim();
        }
        if (/required\s*:\s*(true|\[true)/.test(fieldDef)) required = true;
        if (/unique\s*:\s*true/.test(fieldDef)) {
          unique = true;
          isIndex = true;
        }
        if (/index\s*:\s*true/.test(fieldDef)) isIndex = true;

        const refMatch = fieldDef.match(/ref\s*:\s*['"`]([^'"`]+)['"`]/);
        if (refMatch) {
          ref = refMatch[1];
        }
      } else if (fieldDef.startsWith('[')) {
        isArray = true;
        type = 'Array';
        const innerRefMatch = fieldDef.match(/ref\s*:\s*['"`]([^'"`]+)['"`]/);
        if (innerRefMatch) {
          ref = innerRefMatch[1];
          type = `Array<${ref}>`;
        }
      } else {
        type = fieldDef.replace(/mongoose\.Schema\.Types\./g, '').trim();
      }

      const isForeignKey = Boolean(ref);
      if (isForeignKey) {
        relations.push({
          id: `rel_${modelName}_${fieldName}`,
          source: modelName,
          target: ref,
          sourceField: fieldName,
          targetField: '_id',
          type: isArray ? '1:N' : 'N:1',
          description: `${modelName}.${fieldName} references ${ref}._id`,
        });
      }

      fields.push({
        name: fieldName,
        type: normalizeTypeName(type),
        required,
        unique,
        isIndex,
        isForeignKey,
        refModel: ref || null,
        isArray,
      });
    }

    // Check for indexes defined via .index({ ... })
    const indexMatches = content.matchAll(/\.index\s*\(\s*\{([^}]+)\}/g);
    for (const im of indexMatches) {
      const indexFields = im[1].split(',').map((p) => p.split(':')[0].trim().replace(/['"`]/g, ''));
      indexFields.forEach((idxField) => {
        const found = fields.find((f) => f.name === idxField);
        if (found) found.isIndex = true;
      });
    }

    // Diagnostics checks for this entity
    const diagnostics = [];
    fields.forEach((f) => {
      // 1. Missing index on foreign key
      if (f.isForeignKey && !f.isIndex && !f.unique && !f.isArray) {
        diagnostics.push({
          type: 'warning',
          code: 'MISSING_FK_INDEX',
          field: f.name,
          message: `Foreign key reference "${f.name}" to "${f.refModel}" has no index; lookups may perform collection scans.`,
          suggestion: `Add { index: true } to ${f.name} definition.`,
        });
      }

      // 2. Unbounded array anti-pattern
      if (f.isArray && f.isForeignKey) {
        diagnostics.push({
          type: 'info',
          code: 'UNBOUNDED_ARRAY',
          field: f.name,
          message: `Array of references "${f.name}" can grow indefinitely and exceed the 16MB MongoDB BSON document limit.`,
          suggestion: `Consider two-way referencing or child-to-parent referencing instead.`,
        });
      }
    });

    entities.push({
      id: modelName,
      name: modelName,
      sourceFile: file.source,
      fieldCount: fields.length,
      fields,
      diagnostics,
    });
  }

  return { entities, relations };
};

/**
 * Use Gemini AI to augment schema intelligence, discover Prisma/TypeORM/Postgres definitions,
 * or enhance inferred relationships.
 */
const enrichSchemaWithAI = async (files, baseEntities, baseRelations) => {
  try {
    const modelFiles = files.filter((f) =>
      /(model|schema|entity|prisma|db)/i.test(f.source) &&
      !/(spec|test|\.d\.ts)/i.test(f.source)
    );

    if (modelFiles.length === 0 && baseEntities.length === 0) {
      return null;
    }

    const snippets = modelFiles.slice(0, 10).map((f) => `// File: ${f.source}\n${f.content.slice(0, 1800)}`).join('\n\n');

    const prompt = `Analyze these schema/database model files from a codebase:
${snippets}

Initial parsed tables: ${baseEntities.map(e => e.name).join(', ')}

Return a strict JSON object with this exact shape:
{
  "entities": [
    {
      "id": "EntityName",
      "name": "EntityName",
      "sourceFile": "path/to/file",
      "description": "Short explanation of purpose",
      "fields": [
        {
          "name": "fieldName",
          "type": "String|Number|ObjectId|Date|Boolean|Array",
          "isPrimary": false,
          "required": false,
          "unique": false,
          "isIndex": false,
          "isForeignKey": false,
          "refModel": "TargetEntityOrNull"
        }
      ],
      "diagnostics": [
        {
          "type": "warning|info|error",
          "code": "MISSING_INDEX|UNBOUNDED_ARRAY|N_PLUS_ONE_RISK|CIRCULAR_DEP",
          "field": "fieldName",
          "message": "Description of potential bottleneck",
          "suggestion": "How to resolve"
        }
      ]
    }
  ],
  "relations": [
    {
      "id": "rel_1",
      "source": "EntityA",
      "target": "EntityB",
      "sourceField": "bId",
      "targetField": "_id",
      "type": "1:N|N:1|1:1|M:N",
      "description": "Relation summary"
    }
  ],
  "summary": {
    "totalEntities": 0,
    "totalRelations": 0,
    "totalIndexes": 0,
    "schemaHealthScore": 85,
    "bottlenecksIdentified": 2
  }
}
Respond with JSON only.`;

    const aiResponse = await geminiChat(
      'You are a senior database architect and performance engineer. Return only raw valid JSON without markdown tags.',
      prompt
    );

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.entities && parsed.entities.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn(`⚠️ AI schema enrichment skipped: ${err.message}`);
  }
  return null;
};

/**
 * Main service method to analyze repository models and return schema intelligence
 */
const analyzeSchema = async (files = []) => {
  // 1. Filter model & schema candidate files
  const candidateFiles = files.filter((f) => {
    const src = f.source.toLowerCase();
    return (
      (src.includes('model') || src.includes('schema') || src.includes('entities') || src.endsWith('.prisma')) &&
      !src.includes('test') &&
      !src.includes('spec') &&
      !src.includes('.map')
    );
  });

  // 2. Regex / AST-based parsing
  const { entities, relations } = extractMongooseModelsRegex(candidateFiles.length > 0 ? candidateFiles : files);

  // 3. Optional AI Enrichment
  let finalSchema = null;
  if (entities.length > 0) {
    const enriched = await enrichSchemaWithAI(candidateFiles, entities, relations);
    if (enriched && enriched.entities && enriched.entities.length >= entities.length) {
      finalSchema = enriched;
    }
  }

  if (!finalSchema) {
    // Build standard structure if AI enrichment wasn't used or returned partial
    let totalIndexes = 0;
    let bottlenecks = 0;

    entities.forEach((ent) => {
      ent.fields.forEach((f) => {
        if (f.isIndex || f.unique || f.isPrimary) totalIndexes++;
      });
      bottlenecks += (ent.diagnostics || []).length;
    });

    const healthPenalty = Math.min(bottlenecks * 8, 40);
    const schemaHealthScore = Math.max(100 - healthPenalty, 40);

    finalSchema = {
      entities,
      relations,
      summary: {
        totalEntities: entities.length,
        totalRelations: relations.length,
        totalIndexes,
        schemaHealthScore,
        bottlenecksIdentified: bottlenecks,
      },
    };
  }

  return finalSchema;
};

module.exports = {
  analyzeSchema,
  extractMongooseModelsRegex,
};

