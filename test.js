// remove-large-games.js
const fs = require('fs');
const path = require('path');
const largeGames = require('/home/grant1001/Documents/GitHub/therealwebsite/data/large.json');

async function removeGames() {
    // Track results
    const results = {
        removed: [],
        failed: [],
        notFound: []
    };

    console.log('Starting removal of large game folders...\n');

    try {
        // Create backup list
        const backupList = largeGames.map(game => ({
            name: game.name,
            directory: game.directory,
            size: game.sizeInMB + ' MB'
        }));

        // Save backup list
        await fs.promises.writeFile(
            'removed-games-backup.json', 
            JSON.stringify(backupList, null, 2)
        );
        console.log('✅ Created backup list in removed-games-backup.json');

        // Process each game
        for (const game of largeGames) {
            const gamePath = path.join('semag', game.directory);
            console.log(`\nProcessing: ${game.name} (${game.directory})`);

            try {
                // Check if directory exists
                if (!fs.existsSync(gamePath)) {
                    console.log(`⚠️  ${game.directory} not found, skipping...`);
                    results.notFound.push(game.directory);
                    continue;
                }

                // Remove directory
                await fs.promises.rm(gamePath, { recursive: true });
                console.log(`✅ Removed ${game.directory}`);
                results.removed.push(game.directory);

            } catch (error) {
                console.error(`❌ Error removing ${game.directory}: ${error.message}`);
                results.failed.push({
                    directory: game.directory,
                    error: error.message
                });
            }
        }

        // Create summary report
        const report = `
Large Games Removal Report
${new Date().toLocaleString()}

Summary:
- Successfully removed: ${results.removed.length} games
- Failed to remove: ${results.failed.length} games
- Not found: ${results.notFound.length} games

Successfully Removed:
${results.removed.map(dir => `- ${dir}`).join('\n')}

${results.failed.length > 0 ? `
Failed to Remove:
${results.failed.map(f => `- ${f.directory}: ${f.error}`).join('\n')}
` : ''}

${results.notFound.length > 0 ? `
Not Found:
${results.notFound.map(dir => `- ${dir}`).join('\n')}
` : ''}
`;

        await fs.promises.writeFile('removal-report.txt', report);
        
        console.log('\n=== Summary ===');
        console.log(`✅ Successfully removed: ${results.removed.length} games`);
        console.log(`❌ Failed to remove: ${results.failed.length} games`);
        console.log(`⚠️  Not found: ${results.notFound.length} games`);
        console.log('\nDetailed report saved to removal-report.txt');
        
        console.log('\nNext steps:');
        console.log('1. Open GitHub Desktop');
        console.log('2. Review the changes');
        console.log('3. Commit with message "Move large games to R2 storage"');
        console.log('4. Push changes to GitHub');

    } catch (error) {
        console.error('Error during removal process:', error);
    }
}

// Ask for confirmation
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('⚠️  WARNING: This script will remove large game folders from your local directory.');
console.log('The files will be DELETED from your computer.');
console.log(`Will process ${largeGames.length} games.\n`);
console.log('Make sure you have:\n1. Uploaded all games to R2\n2. Created a backup if needed\n');

readline.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
        removeGames().finally(() => readline.close());
    } else {
        console.log('Operation cancelled');
        readline.close();
    }
});
