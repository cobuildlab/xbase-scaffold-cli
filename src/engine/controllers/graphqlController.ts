/* eslint-disable @typescript-eslint/no-explicit-any */
import * as _ from 'lodash';
import * as fs from 'fs';
import { parse, FieldDefinitionNode } from 'graphql';
import { ObjectTypeExtensionNode } from 'graphql/language/ast';
import { GraphQLFunctionType } from '../../interfaces/Extensions';
import { ProjectDefinition } from '../../interfaces/Project';
import { makeExecutableSchema } from 'graphql-tools';
import { rootGraphqlSchema } from '../../consts/RootSchema';

export class GraphqlController {
  /**
   * @param {string[]} schemaPaths - Schema Paths.
   * @param {string} predefineSchema - Predefine Schema.
   * @returns {any} - Any.
   */
  static loadSchema(schemaPaths: string[], predefineSchema = ''): string {
    return _.reduce<string, string>(
      schemaPaths,
      (res: string, file: string): string => {
        res += fs.readFileSync(file);
        return res;
      },
      predefineSchema,
    );
  }

  /**
   * @param {string} gqlSchema - GqlSchema.
   * @returns {any} - Any.
   */
  static defineGqlFunctionsType(
    gqlSchema: string,
  ): { [functionName: string]: GraphQLFunctionType } {
    // bad solution, I think
    // parse graphql file and get function type for all each function
    if (!gqlSchema) {
      return;
    }
    const parsedSchema = parse(gqlSchema);
    return _.transform(
      parsedSchema.definitions,
      (res: any, data: any) => {
        switch (data.kind) {
          case 'ObjectTypeExtension': {
            const extension = data as ObjectTypeExtensionNode;
            const graphqlType = data.name.value;
            const extendedFieldNames = GraphqlController.processFields(
              extension.fields,
            );
            extendedFieldNames.forEach((field) => (res[field] = graphqlType));
          }
        }
      },
      {},
    );
  }

  /**
   * @param {ProjectDefinition} project - Project.
   */
  static validateSchema(project: ProjectDefinition): void {
    // TODO: add mutations and queries
    makeExecutableSchema({
      typeDefs: project.gqlSchema + rootGraphqlSchema(),
      resolvers: {
        Mutation: {},
        Query: {},
      },
    });
  }

  /**
   * @param {FieldDefinitionNode[]} fields - Fields.
   * @returns {string[]} - Fields.
   */
  private static processFields(fields: FieldDefinitionNode[]): string[] {
    return _.transform(
      fields,
      (res: any[], f: any) => {
        res.push(f.name.value);
      },
      [],
    );
  }
}
