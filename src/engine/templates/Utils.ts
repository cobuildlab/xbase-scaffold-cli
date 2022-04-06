import { FieldSchema, FIELD_TYPE } from '@8base/utils';

/**
 * @param {string} moduleNames - Module names for the Routes.
 * @returns {string} - Template.
 */
export const mapRoutes = (moduleNames: string[]): string => {
  let routes = '';
  moduleNames.forEach((module) => {
    const moduleNameMayus = module.charAt(0).toUpperCase() + module.slice(1);
    routes += `
    <Route
      path="/${module}"
      element={<Layout><${moduleNameMayus}View /></Layout>}
     />
    <Route
      path="/${module}/create"
      element={<Layout><Create${moduleNameMayus}View /></Layout>}
    />
    <Route
      path="/${module}/update"
      element={<Layout><Update${moduleNameMayus}View /></Layout>}
    />
    <Route
      path="/${module}/details/:id"
      element={<Layout><${moduleNameMayus}DetailsView /></Layout>}
    /> \n
   `;
  });
  return routes;
};

/**
 * @param {string} moduleNames - Module names for the Routes.
 * @returns {string} - Template.
 */
export const mapImportRoutes = (moduleNames: string[]): string => {
  let importRoutes = '';
  moduleNames.forEach((module) => {
    const moduleNameMayus = module.charAt(0).toUpperCase() + module.slice(1);
    importRoutes += `import { ${moduleNameMayus}View } from './modules/${module}/${moduleNameMayus}View';\n
      import { Create${moduleNameMayus}View } from './modules/${module}/components/Create${moduleNameMayus}View';\n
      import { Update${moduleNameMayus}View } from './modules/${module}/components/Update${moduleNameMayus}View';\n
      import { ${moduleNameMayus}DetailsView } from './modules/${module}/components/${moduleNameMayus}DetailsView';\n
      `;
  });
  return importRoutes;
};

/**
 * @param {string} fields - Fields for the table's titles.
 * @param {boolean} title - Boolean for the map.
 * @returns {string} - Template.
 */
export const mapTableRows = (fields: string[], title: boolean): string => {
  let rows = '';
  fields.forEach((field) => {
    if (title) {
      rows += `<StyledTableCell>${field}</StyledTableCell> \n`;
    } else {
      rows += '<StyledTableCell>Data</StyledTableCell> \n';
    }
  });
  return rows;
};

/**
 * @param {FieldSchema[]} fields - Fields.
 * @returns {string} - Template.
 */
export const mapTextFields = (fields: FieldSchema[]): string => {
  let textFields = '';
  fields.forEach((field) => {
    if (field.fieldType === FIELD_TYPE.DATE)
      textFields += `
      <Grid item md={12}>
      <Title>${field.displayName}</Title>
      <CustomInput
        fullWidth
        type="date"
        style={{ margin: '10px 0px' }}
      />
    </Grid> \n`;

    if (field.fieldType === FIELD_TYPE.NUMBER)
      textFields += `
      <Grid item md={12}>
      <Title>${field.displayName}</Title>
      <CustomInput
        fullWidth
        type="number"
        style={{ margin: '10px 0px' }}
      />
    </Grid> \n`;

    textFields += `
      <Grid item md={12}>
      <Title>${field.displayName}</Title>
      <CustomInput
        fullWidth
        style={{ margin: '10px 0px' }}
      />
    </Grid> \n`;
  });
  return textFields;
};

/**
 * @param {string} fields - Fields for the Details view.
 * @returns {string} - Template.
 */
export const mapTextFieldsDetails = (fields: string[]): string => {
  let textFields = '';

  fields.forEach((field) => {
    textFields += `
    <Grid item md={6}>
      <Title>${field}</Title>
      <Typography>Data</Typography>
    </Grid> \n `;
  });

  return textFields;
};
