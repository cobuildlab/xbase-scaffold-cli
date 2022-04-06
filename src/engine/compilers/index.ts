import { ICompiler } from '../../interfaces/ICompiler';
import { TypescriptCompiler } from './tsCompiler';
import { Context } from '../../common/context';

/**
 * @param {string[]} files - Files.
 * @param {Context} context - Context.
 * @returns {ICompiler} - Compiler.
 */
export function getCompiler(files: string[], context: Context): ICompiler {
  return new TypescriptCompiler(files, context);
}
