import fs from 'fs';
import path from 'path';
import {
  buildTemplateMainView,
  buildtemplateRouter,
} from './templates/builder.js';

const tablesSchema = [
  {
    tableName: 'case',
    fields: [
      {
        name: 'attorney',
        type: 'text',
      },
      {
        name: 'code',
        type: 'number',
      },
      {
        name: 'status',
        type: 'boolean',
      },
      {
        name: 'caseID',
        type: 'text',
      },
    ],
  },
  {
    tableName: 'driver',
    fields: [
      {
        name: 'name',
        type: 'text',
      },
      {
        name: 'email',
        type: 'number',
      },
      {
        name: 'archived',
        type: 'date',
      },
      {
        name: 'caseID',
        type: 'text',
      },
    ],
  },
];
const nameApp = 'app1';
const dirname = import.meta.url;
const newDir = dirname.split('xbase-scaffold-cli');
const route = `.${path.dirname(newDir[1])}/repo`;
const appRoute = `./${nameApp}`;
console.log(appRoute);

for (let i = 0; i <= tablesSchema.length - 1; i++) {
  // first we create the folders
  const tableName = tablesSchema[i].tableName;
  const fields = tablesSchema[i].fields.map((field) => field.name);
  const moduleNameMayus =
    tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const moduleView = buildTemplateMainView(moduleNameMayus, fields);

  fs.mkdir(
    `${appRoute}/src/modules/${tableName}/components`,
    {
      recursive: true,
    },
    (err) => {
      if (err) {
        console.log('err', err);
      } else {
        fs.writeFile(
          `${appRoute}/src/modules/${tableName}/${moduleNameMayus}View.tsx`,
          moduleView,
          (err) => {
            if (err) console.log('err', err);
          },
        );
      }
    },
  );
}

const routerFile = buildtemplateRouter(
  tablesSchema.map((table) => table.tableName),
);
if (routerFile) {
  fs.writeFile(`${appRoute}/src/routes.tsx`, routerFile, (err) =>
    console.log(err),
  );
}

/* console.log(`${route}/test.js`);
fs.writeFile(`${route}/test.js`, template, (err) => {
  if (err) console.log('err', err);
});
fs.mkdirSync(`${route}/carpeta/carpeta2`, {
  recursive: true,
}); */

/* const __dirname = process.cwd(); */
/* console.log('asd', __dirname);
console.log('path', fs.realpathSync('.'));
console.log('path', path.relative('./src', import.meta.url)); */
/* try {
  const algo = fs.readFileSync('./package.json', { encoding: 'utf8' });
  console.log('algo', algo);
} catch (err) {
  console.log('err', err);
} */
