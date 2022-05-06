import { Command } from 'commander';
import { ActionGeneratorType } from '../core/types/ActionGeneratorType';

export const getProgram = () => {
    const program = new Command();

    program
    .description(
        'Generates typescript code from Openapi files.\n'
        + 'Code includes request and response types for every operation.\n'
        + 'For responses, uses zod to create validators for every status code.\n'
        + 'It optionally can create binding code for:\n'
        + '- react-fetching-library\n'
    )
    .option(
        '-s, --skip-post-process',
        'Skips the postprocess (prettier and linter)',
        false
    )
    .option(
        '-a, --action-generator <action-generator>',
        'Chooses the generator for the actions by client:\n'
        + '- react-fetching-library: https://github.com/marcin-piela/react-fetching-library\n'
        + '- none: Does not generate any action, only the validators and the types.\n',
        (actionGenerator: string): ActionGeneratorType => {
            if (actionGenerator.toUpperCase() === 'REACT-FETCHING-LIBRARY') {
                return ActionGeneratorType.REACT_FETCHING_LIBRARY;
            } else if (actionGenerator.toUpperCase() === 'NONE') {
                return ActionGeneratorType.NONE;
            }

            throw new Error(`Unknown action generator: ${actionGenerator}`);
        },
        ActionGeneratorType.NONE
    )
    .option(
        '-ed, --add-eslint-disable',
        'Add /* eslint-disable */ on top of the file after processing',
        false
    )
    .option(
        '-st, --skip-types',
        'Skip the types, useful for js building',
        false
    )
    .option(
        '--no-strict',
        'Whether or not to use the non-strict checking of zod. \n' +
        'If --no-strict is set, the unknown keys are ignored instead of counting as an error.\n' +
        'This could be useful to avoid failing if a new schema adds new properties to objects.'
    )
    .option(
        '--api-base-path <api-base-path>',
        'Override base path for all the services'
    )
    .option(
        '--explicit-types',
        '(Experimental) Whether or not to use explicit types instead of inferring from zod schema. \n' +
        'This generates the typescript `Type` instead of inferring. Makes the types more human readable and in \n' +
        'some cases it could help the IDE when dealing with recursion.',
        false
    )
    .requiredOption(
        '-i, --input <openapijson-file-or-url>',
        'URL or local path to the openapi.json file.'
    )
    .requiredOption(
        '-o, --output <output-path>',
        'Output file to put the generated files.'
    );

    return program;
};
