const fs = require('fs');
const path = require('path');

console.log('--- STARTING CODEBASE ANALYSIS ---');

// 1. Find unused dependencies in Backend
try {
    const pkgPath = path.join(__dirname, 'backend', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});
    let usedDeps = new Set();
    
    function checkFile(file) {
        const content = fs.readFileSync(file, 'utf8');
        deps.forEach(dep => {
            if (content.includes(`require('${dep}')`) || content.includes(`require("${dep}")`)) {
                usedDeps.add(dep);
            }
        });
    }
    
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                if (!file.includes('node_modules')) walk(file);
            } else if (file.endsWith('.js')) {
                checkFile(file);
            }
        });
    }
    
    walk(path.join(__dirname, 'backend', 'controllers'));
    walk(path.join(__dirname, 'backend', 'modules'));
    walk(path.join(__dirname, 'backend', 'routes'));
    walk(path.join(__dirname, 'backend', 'utils'));
    walk(path.join(__dirname, 'backend', 'middleware'));
    checkFile(path.join(__dirname, 'backend', 'server.js'));
    
    const unused = deps.filter(d => !usedDeps.has(d));
    console.log('\\n[1] UNUSED BACKEND DEPENDENCIES:');
    console.log(unused.join(', ') || 'None found (all listed dependencies appear in require statements).');
} catch (e) {
    console.error('Error checking dependencies:', e.message);
}

// 2. Find Scratchpad/Debug files in Root
try {
    const rootDir = __dirname;
    const items = fs.readdirSync(rootDir);
    const rootFiles = items.filter(i => {
        const p = path.join(rootDir, i);
        return fs.statSync(p).isFile() && (i.endsWith('.js') || i.endsWith('.txt') || i.endsWith('.log') || i.endsWith('.bat'));
    });
    
    console.log('\\n[2] ROOT CLUTTER (Debug scripts, logs, old configs):');
    console.log(`Found ${rootFiles.length} files that are likely unnecessary in production/clean repo.`);
    // print first 20 as sample
    console.log(rootFiles.slice(0, 20).join(', ') + (rootFiles.length > 20 ? ' ...and more.' : ''));
} catch (e) {
    console.error('Error checking root:', e.message);
}

// 3. Find Unused Backend controllers/routes
// Very basic: Is the controller file required in any route?
try {
    const controllersDir = path.join(__dirname, 'backend', 'controllers');
    if (fs.existsSync(controllersDir)) {
        const controllers = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
        const routesDir = path.join(__dirname, 'backend', 'routes');
        let usedControllers = new Set();
        
        if (fs.existsSync(routesDir)) {
            const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
            routes.forEach(routeFile => {
                const content = fs.readFileSync(path.join(routesDir, routeFile), 'utf8');
                controllers.forEach(ctrl => {
                    const baseName = ctrl.replace('.js', '');
                    if (content.includes(`require('../controllers/${baseName}')`) || content.includes(`require("../controllers/${baseName}")`)) {
                        usedControllers.add(ctrl);
                    }
                });
            });
        }
        
        const unusedControllers = controllers.filter(c => !usedControllers.has(c));
        console.log('\\n[3] UNUSED CONTROLLERS:');
        console.log(unusedControllers.join(', ') || 'All controllers are mounted in routes.');
    }
} catch (e) {
    console.error('Error checking controllers:', e.message);
}

console.log('\\n--- ANALYSIS COMPLETE ---');
