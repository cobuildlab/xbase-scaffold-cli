export const buildtemplateRouter = (modules) => {
  let imports = '';
  let routes = '';

  modules?.forEach((module) => {
    const moduleNameMayus = module.charAt(0).toUpperCase() + module.slice(1);

    imports += `import { ${moduleNameMayus}View } from './modules/${module}/${moduleNameMayus}View';\n`;
    routes += `<Route path="/dashboard" 
                element={
                  <Layout>
                  <${moduleNameMayus}View />
                  </Layout>
                }
                /> \n`;
  });
  return `import React from 'react';
    import { Routes as RoutesComponent, Route } from 'react-router-dom';
    import { ApolloProvider } from '@apollo/client';
    import { Auth } from './modules/auth/Auth';
    import { AuthCallback } from './modules/auth/components/AuthCallback';
    import { Logout } from './modules/auth/Logout';
    import { Session } from './modules/auth/Session';
    import { apolloClient as client } from './shared/apollo';
    import { Auth0ProviderWithHistory } from './modules/auth/Auth0ProviderWithHistory';
    import { Layout } from './shared/components/Layout/Layout';
    import { Redirect } from './shared/components/Redirect';
    import { Dashboard } from './modules/dashboard/DashboardView';
    ${imports}

    /**
     * @returns Routes.
     */
    export const Routes: React.FC = () => {
      return (
        <Auth0ProviderWithHistory>
          <ApolloProvider client={client}>
            <RoutesComponent>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="*"
                element={
                  <Session>
                    <RoutesComponent>
                      <Route path="/logout" element={<Logout />} />
                      <Route
                        path="/dashboard"
                        element={
                          <Layout>
                            <Dashboard />
                          </Layout>
                        }
                      />
                      ${routes}
                      <Route path="/home" element={<Layout>Home</Layout>} />
                      <Route path="/" element={<Redirect to="/dashboard" />} />
                    </RoutesComponent>
                  </Session>
                }
              ></Route>
            </RoutesComponent>
          </ApolloProvider>
        </Auth0ProviderWithHistory>
      );
    };
    `;
};

export const buildTemplateMainView = (moduleName, fields) => {
  let rows1 = '';
  let rows2 = '';
  fields?.forEach((field) => {
    rows1 += `<StyledTableCell>${field}</StyledTableCell> \n`;
    rows2 += `<StyledTableCell>Data</StyledTableCell> \n`;
  });

  return `
    import {
      Button,
      Card,
      CardContent,
      Grid,
      Table,
      TableBody,
      TableContainer,
      TableHead,
      TableRow,
    } from '@mui/material';
    import AddIcon from '@mui/icons-material/Add';
    import { Box } from '@mui/system';
    import React, { useState } from 'react';
    import {
      DefaultRowSize,
      TableToolbar,
    } from '../../shared/components/table/TableToolbar';
    import { usePagination } from '../../shared/hooks/hooks';
    import { FilterMenu } from '../../shared/components/FilterMenu';
    import { PaperStyled } from '../../shared/components/card/Card';
    import { StyledTableCell } from '../../shared/components/table/TableRowStyled';
    import { TableRowLoading } from '../../shared/components/table/TableRowLoading';
    import { Pagination } from '../../shared/components/table/Pagination';
    import { Pill } from '../../shared/components/Pills';
    import { makeStyles } from '@mui/styles';
    
    const useStyles = makeStyles(() => ({
      card: {
        background: '#fff',
        borderRadius: '8px',
      },
    }));
    
    /**
     * @returns {JSX.Element} - View component.
     */
    export const ${moduleName}View: React.FC = () => {
      const [loading] = useState(false);
      const classes = useStyles();
      const [{ page, pageSize }, setPage] = usePagination({
        deafultPage: 1,
        deafultPageSize: 10,
      });
      return (
        <>
          <Box padding="0px 50px">
            <Card className={classes.card}>
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <TableToolbar
                      defaultRow={pageSize as DefaultRowSize}
                      rightComponent={
                        <Button
                          style={{ textTransform: 'none' }}
                          variant="contained"
                          sx={{
                            background: '#005A42',
                            width: {
                              xs: '100%',
                              md: 'auto',
                            },
                          }}
                          startIcon={<AddIcon />}>
                          create Customers
                        </Button>
                      }
                      menuButtonComponent={
                        <FilterMenu onCancel={() => {}} onApply={() => {}} />
                      }
                    />
                  </Grid>
    
                  <Grid item md={12}>
                    <TableContainer component={PaperStyled}>
                      <Table sx={{ minWidth: 650, marginTop: '30px' }}>
                        <TableHead sx={{ whiteSpace: 'nowrap' }}>
                          <TableRow>
                           ${rows1}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loading && ![].length && (
                            <TableRowLoading loading={loading} colSpan={9} />
                          )}
                          <TableRow
                            sx={{
                              borderBottom: '0px',
                              borderStyle: 'none',
                              cursor: 'pointer',
                            }}
                            hover>
                            ${rows2}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      totalCount={0}
                      onChange={(value) => setPage({ page: value })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </>
      );
    };
    
    `;
};
