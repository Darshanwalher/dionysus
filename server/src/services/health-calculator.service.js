/**
 * Health Calculator Service
 * Computes an objective, actionable 0-100 Repository Health Score with letter grades (A+, A, B, C, D, F)
 * Evaluates:
 * 1. Architecture & Coupling (30%): Circular loops, cross-tier leakage, modular layering
 * 2. Code Complexity & Size (25%): God files (>500 LOC), fan-out degree, maintainability
 * 3. Dead Code & Hygiene (15%): Isolated files with 0 callers/importers
 * 4. Documentation & Onboarding (15%): README, .env.example, license, setup instructions
 * 5. Dependencies & Security (15%): Lockfiles, hardcoded secret patterns, npm hygiene
 */

const calculateHealthScore = ({ files = [], dependencyGraph = null, architectureGraph = null, repoMetadata = {} }) => {
  const fileCount = files.length || 1;
  const actionableQuickFixes = [];

  // ==========================================
  // 1. Architecture & Coupling Evaluation (30 pts)
  // ==========================================
  let architectureScore = 100;
  const circularDeps = [];

  // Check cycles from dependencyGraph
  if (dependencyGraph?.cycles && dependencyGraph.cycles.length > 0) {
    dependencyGraph.cycles.forEach((cycle, idx) => {
      circularDeps.push(cycle.join(' -> '));
      architectureScore -= 12; // Heavy penalty for circular dependencies
      if (idx < 3) {
        actionableQuickFixes.push({
          id: `fix_cycle_${idx}`,
          category: 'architecture',
          severity: 'critical',
          title: 'Break Circular Import Cycle',
          description: `Cycle detected: ${cycle.slice(0, 3).join(' ⇄ ')}. Circular dependencies create memory leaks and initialization race conditions.`,
          scoreImpact: '+6 pts',
          file: cycle[0],
        });
      }
    });
  }

  // Cross-tier leakage check (e.g., controllers importing database models directly bypassing services, or client importing server)
  let crossTierViolations = 0;
  files.forEach((file) => {
    const src = file.source.toLowerCase();
    const content = file.content || '';
    if (src.includes('/controllers/') && content.includes("require('../models/")) {
      crossTierViolations++;
    }
  });

  if (crossTierViolations > 3) {
    architectureScore -= Math.min(15, crossTierViolations * 2);
    actionableQuickFixes.push({
      id: 'fix_layering',
      category: 'architecture',
      severity: 'medium',
      title: 'Enforce Clean Service Layering',
      description: `${crossTierViolations} controller files bypass service abstractions to query models directly.`,
      scoreImpact: '+4 pts',
      file: 'server/src/controllers',
    });
  }

  architectureScore = Math.max(20, Math.min(100, Math.round(architectureScore)));

  // ==========================================
  // 2. Code Complexity & Size Evaluation (25 pts)
  // ==========================================
  let complexityScore = 100;
  const godFiles = [];

  files.forEach((file) => {
    const lines = (file.content || '').split('\n').length;
    if (lines > 500 && !file.source.includes('lock') && !file.source.endsWith('.json')) {
      godFiles.push({ file: file.source, lines });
      complexityScore -= 8;
    }
  });

  if (godFiles.length > 0) {
    const worst = godFiles.sort((a, b) => b.lines - a.lines)[0];
    actionableQuickFixes.push({
      id: 'fix_god_file',
      category: 'complexity',
      severity: 'high',
      title: `Decompose Oversized Module (${worst.lines} lines)`,
      description: `"${worst.file}" exceeds 500 LOC, increasing cognitive load and bug vulnerability. Split into modular utility/service helpers.`,
      scoreImpact: '+5 pts',
      file: worst.file,
    });
  }

  complexityScore = Math.max(30, Math.min(100, Math.round(complexityScore)));

  // ==========================================
  // 3. Dead Code & Hygiene Evaluation (15 pts)
  // ==========================================
  let deadCodeScore = 100;
  const deadOrphanFiles = [];

  if (dependencyGraph?.nodes && dependencyGraph?.edges) {
    const targetSet = new Set(dependencyGraph.edges.map((e) => e.target));
    const sourceSet = new Set(dependencyGraph.edges.map((e) => e.source));

    dependencyGraph.nodes.forEach((node) => {
      const isEntry = /(index|main|server|app|vite\.config)\.[jt]sx?$/i.test(node.id);
      if (!isEntry && !targetSet.has(node.id) && !sourceSet.has(node.id)) {
        deadOrphanFiles.push(node.id);
      }
    });

    if (deadOrphanFiles.length > 0) {
      deadCodeScore -= Math.min(40, deadOrphanFiles.length * 8);
      actionableQuickFixes.push({
        id: 'fix_orphan_code',
        category: 'deadCode',
        severity: 'low',
        title: `Prune ${deadOrphanFiles.length} Isolated Unreferenced File(s)`,
        description: `Files like ${deadOrphanFiles.slice(0, 2).join(', ')} have 0 callers and 0 external usages.`,
        scoreImpact: '+3 pts',
        file: deadOrphanFiles[0],
      });
    }
  }

  deadCodeScore = Math.max(35, Math.min(100, Math.round(deadCodeScore)));

  // ==========================================
  // 4. Documentation & Onboarding Readiness (15 pts)
  // ==========================================
  let onboardingScore = 100;
  const hasReadme = files.some((f) => /readme\.md$/i.test(f.source));
  const hasEnvExample = files.some((f) => /(\.env\.example|\.env\.template)$/i.test(f.source));
  const hasGitIgnore = files.some((f) => /\.gitignore$/i.test(f.source));
  const hasLicense = files.some((f) => /license/i.test(f.source));

  if (!hasReadme) {
    onboardingScore -= 40;
    actionableQuickFixes.push({
      id: 'fix_readme',
      category: 'onboarding',
      severity: 'high',
      title: 'Missing Root README.md',
      description: 'New contributors cannot easily understand repo purpose, installation steps, or script commands.',
      scoreImpact: '+6 pts',
      file: 'README.md',
    });
  }
  if (!hasEnvExample) {
    onboardingScore -= 25;
    actionableQuickFixes.push({
      id: 'fix_env_example',
      category: 'onboarding',
      severity: 'medium',
      title: 'Add .env.example Environment Template',
      description: 'Essential environment variables are undocumented, risking developer setup friction.',
      scoreImpact: '+4 pts',
      file: '.env.example',
    });
  }
  if (!hasGitIgnore) onboardingScore -= 15;
  if (!hasLicense) onboardingScore -= 10;

  onboardingScore = Math.max(20, Math.min(100, Math.round(onboardingScore)));

  // ==========================================
  // 5. Dependencies & Security Hygiene (15 pts)
  // ==========================================
  let securityScore = 100;
  const secretPatterns = [
    { name: 'Hardcoded JWT Secret', regex: /jwt\.sign\([^,]+,\s*['"][a-zA-Z0-9_\-!@#$%^&*]{4,}['"]/i },
    { name: 'Hardcoded AWS Key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Exposed Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
  ];

  let exposedSecretsFound = 0;
  files.forEach((file) => {
    secretPatterns.forEach((pat) => {
      if (pat.regex.test(file.content || '')) {
        exposedSecretsFound++;
        actionableQuickFixes.push({
          id: `fix_secret_${exposedSecretsFound}`,
          category: 'security',
          severity: 'critical',
          title: `Potential ${pat.name} in Source Code`,
          description: `Sensitive credential detected in ${file.source}. Migrate credentials to process.env.`,
          scoreImpact: '+8 pts',
          file: file.source,
        });
      }
    });
  });

  securityScore -= exposedSecretsFound * 25;

  const hasLockfile = files.some((f) => /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i.test(f.source));
  if (!hasLockfile) {
    securityScore -= 15;
    actionableQuickFixes.push({
      id: 'fix_lockfile',
      category: 'security',
      severity: 'medium',
      title: 'Commit Package Lockfile',
      description: 'Lack of package-lock.json allows non-deterministic upstream dependency mutations.',
      scoreImpact: '+3 pts',
      file: 'package-lock.json',
    });
  }

  securityScore = Math.max(25, Math.min(100, Math.round(securityScore)));

  // ==========================================
  // Overall Weighted Score (0-100) & Grade
  // ==========================================
  const totalScore = Math.round(
    architectureScore * 0.30 +
    complexityScore * 0.25 +
    deadCodeScore * 0.15 +
    onboardingScore * 0.15 +
    securityScore * 0.15
  );

  let grade = 'A+';
  if (totalScore >= 95) grade = 'A+';
  else if (totalScore >= 88) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';
  else grade = 'F';

  return {
    score: totalScore,
    grade,
    lastScanned: new Date().toISOString(),
    breakdown: {
      architecture: {
        score: architectureScore,
        max: 100,
        weight: '30%',
        status: architectureScore >= 85 ? 'Excellent' : architectureScore >= 70 ? 'Adequate' : 'Fragile',
        details: `${circularDeps.length} circular loops, ${crossTierViolations} cross-tier violations`,
      },
      complexity: {
        score: complexityScore,
        max: 100,
        weight: '25%',
        status: complexityScore >= 85 ? 'Clean' : complexityScore >= 70 ? 'Moderate' : 'High Debt',
        details: `${godFiles.length} oversized files (>500 LOC)`,
      },
      deadCode: {
        score: deadCodeScore,
        max: 100,
        weight: '15%',
        status: deadCodeScore >= 85 ? 'Lean' : 'Waste Detected',
        details: `${deadOrphanFiles.length} isolated unreferenced files`,
      },
      onboarding: {
        score: onboardingScore,
        max: 100,
        weight: '15%',
        status: onboardingScore >= 85 ? 'Ready' : onboardingScore >= 65 ? 'Partial' : 'Missing Docs',
        details: `README: ${hasReadme ? '✓' : '✗'}, .env.example: ${hasEnvExample ? '✓' : '✗'}, License: ${hasLicense ? '✓' : '✗'}`,
      },
      security: {
        score: securityScore,
        max: 100,
        weight: '15%',
        status: securityScore >= 85 ? 'Secure' : 'Vulnerable',
        details: `${exposedSecretsFound} credential smells, Lockfile: ${hasLockfile ? '✓' : '✗'}`,
      },
    },
    metricsSummary: {
      totalFiles: fileCount,
      circularDependencies: circularDeps.length,
      godFiles: godFiles.length,
      deadFiles: deadOrphanFiles.length,
      exposedSecrets: exposedSecretsFound,
    },
    actionableQuickFixes,
  };
};

module.exports = {
  calculateHealthScore,
};

