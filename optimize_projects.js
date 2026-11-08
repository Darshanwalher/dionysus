const fs = require('fs');
let code = fs.readFileSync('server/src/controllers/project.controller.js', 'utf8');

const target = `const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      members: req.user._id,
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};`;

const replacement = `const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      members: req.user._id,
    })
      .select('name githubUrl owner members createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server/src/controllers/project.controller.js', code, 'utf8');
  console.log('Optimized getMyProjects query successfully');
} else {
  console.log('Target string not found in project.controller.js');
}

