const fs = require('fs');
const { execSync } = require('child_process');

try {
    // Get contents of Landing2.jsx from commit 80afc11 (colleague's)
    const contentA = execSync('git show 80afc11:frontend/src/pages/Landing2.jsx').toString().split('\n');
    // Get current contents of Landing2.jsx
    const contentB = fs.readFileSync('frontend/src/pages/Landing2.jsx', 'utf8').split('\n');

    // Filter out the wizard/wizzar components (usually at the end of the file)
    const cleanA = contentA.filter(line => !line.includes('WIZZAR') && !line.includes('RegistrationWizard') && !line.includes('PaymentInfo') && !line.includes('wizard'));
    const cleanB = contentB.filter(line => !line.includes('WIZZAR') && !line.includes('RegistrationWizard') && !line.includes('PaymentInfo') && !line.includes('wizard'));

    console.log(`Cleaned A lines: ${cleanA.length}, Cleaned B lines: ${cleanB.length}`);

    // Let's write them to temp files and run git diff on them
    fs.writeFileSync('scratch/landing_clean_colleague.jsx', cleanA.join('\n'));
    fs.writeFileSync('scratch/landing_clean_current.jsx', cleanB.join('\n'));

    const diff = execSync('git diff --no-index scratch/landing_clean_colleague.jsx scratch/landing_clean_current.jsx').toString();
    fs.writeFileSync('scratch/landing_diff.txt', diff);
    console.log("DIFF WRITTEN TO scratch/landing_diff.txt");
} catch (e) {
    console.log("Error or diff found (exit code 1 is normal for diff):");
    fs.writeFileSync('scratch/landing_diff.txt', e.stdout ? e.stdout.toString() : e.message);
}
