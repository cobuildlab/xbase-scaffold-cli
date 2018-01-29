import * as fs from "fs";
import * as path from 'path';
import * as yaml from "js-yaml";
import * as _ from "lodash";

import { FunctionDefinition, ProjectDefinition, FunctionType, trace, debug, StaticConfig, ExecutionConfig } from "../../common";
import { InvalidConfiguration } from "../../errors";


export class ProjectController {

    private static configFileName = "./8base.yml";

    static async initialize(config: ExecutionConfig): Promise<ProjectDefinition> {

        const name = path.basename(StaticConfig.rootExecutionDir);
        debug("initialize project \"" + name + "\" complete");

        let project: ProjectDefinition = {
            functions: [],
            name
        };

        const data = ProjectController.loadConfigFile();

        debug("load functions");
        project.functions = ProjectController.loadFunctions(data);

        debug("load functions count = " + project.functions.length);

        return project;
    }

    static getFunctionFiles(project: ProjectDefinition): string[] {
        return _.transform<FunctionDefinition, string>(project.functions, (result, f) => {
            result.push(f.handler.code);
        }, []);
    }

    static getFunctionNames(project: ProjectDefinition): string[] {
        return [];
    }

    private static loadConfigFile(): any {
        const pathToYmlConfig = path.join(StaticConfig.rootExecutionDir, ProjectController.configFileName);

        debug("check exist yaml file = " + pathToYmlConfig);

        if (!fs.existsSync(pathToYmlConfig)) {
            throw new Error("Main configuration file \"" + ProjectController.configFileName + "\" is absent.");
        }

        debug("load yaml file");

        return yaml.safeLoad(fs.readFileSync(pathToYmlConfig, 'utf8'));
    }

    private static loadFunctions(config: any): FunctionDefinition[] {

        return _.transform<any, FunctionDefinition>(config.functions, (result, func, funcname: string) => {

            this.validateFunction(func);

            result.push({
                name: funcname,
                type: func.type as FunctionType,
                handler: { code: func.handler.code },
                schema: { path: func.schema }
             });
        }, []);
    }

    private static validateFunction(func: any) {
        if (_.isNil(func.handler.code) || !fs.existsSync(func.handler.code)) {
            throw new InvalidConfiguration(StaticConfig.serviceConfigFileName, "unnable to determine function \"" + func.name + "\" source code");
        }

        if (!StaticConfig.supportedCompileExtension.has(path.extname(func.handler.code))) {
            throw new InvalidConfiguration(StaticConfig.serviceConfigFileName, "function \"" + func.name + "\" have unsupported file extension");
        }
    }
}

