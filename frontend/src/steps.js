import { StepType } from './types/type';

/**
 * Parses input XML and converts it into steps.
 * @param {string} response - The XML response to be parsed.
 * @returns {Object[]} - An array of steps.
 */
export function parseXml(response) {
    if (!response) return []; // Handle empty or invalid input

    // Extract the XML content inside <boltArtifact>
    const xmlMatch = response.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
    if (!xmlMatch) return [];

    const xmlContent = xmlMatch[1];
    const steps = [];
    let stepId = 1;

    // Extract artifact title from <boltArtifact title="...">
    const titleMatch = response.match(/<boltArtifact[^>]*title="([^"]*)"/);
    const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';

    // Add initial artifact step
    steps.push({
        id: stepId++,
        title: artifactTitle,
        description: '',
        type: StepType.CreateFolder,
        status: 'pending',
    });


    // Regular expression to find <boltAction> elements
   const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath\s*=\s*"([^"]*)")?>([\s\S]*?)<\/boltAction>/g;


    let match;
    while ((match = actionRegex.exec(xmlContent)) !== null) {
        const [, type, filePath, content] = match;
        const trimmedContent = content.trim();

        if (type === 'file') {
            steps.push({
                id: stepId++,
                title: `Create ${filePath || 'file'}`,
                description: '',
                type: StepType.CreateFile,
                status: 'pending',
                code: trimmedContent,
                path: filePath?.trim() || '',
            });
        } else if (type === 'shell') {
            steps.push({
                id: stepId++,
                title: 'Run command',
                description: '',
                type: StepType.RunScript,
                status: 'pending',
                code: trimmedContent,
            });
        }
    }

    return steps;
}
