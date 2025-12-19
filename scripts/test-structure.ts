import { extractStructure } from '../src/lib/parser/structureExtractor';

const sampleResumeText = `
John Doe
john.doe@example.com
(555) 123-4567

Summary
Experienced software engineer with a passion for building scalable systems.

Experience
Senior Engineer at Tech Corp
2020 - Present
- Built amazing things.
- Scaled to 1M users.

Junior Engineer at Startup Inc
2018 - 2020
- Fixed bugs.

Education
BS Computer Science, University of Tech
2014 - 2018

Skills
JavaScript, TypeScript, Node.js, React

Projects
Anti-Resume
- A brutally honest resume reviewer.
`;

console.log('Testing Structure Extraction...');
const structure = extractStructure(sampleResumeText);
console.log(JSON.stringify(structure, null, 2));

if (structure.contact.email === 'john.doe@example.com' &&
    structure.experience.length > 0 &&
    structure.skills.length > 0) {
    console.log('SUCCESS: Structure extraction passed basic checks.');
} else {
    console.error('FAILURE: Structure extraction failed.');
    process.exit(1);
}
