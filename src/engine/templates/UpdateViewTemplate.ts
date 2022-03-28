export const buildUpdateViewTemplate = (
    moduleName: string,
    textfields: string,
) => {

    return `
    import {
        Button,
        Card,
        CardContent,
        Grid,
        IconButton,
        Typography,
      } from '@mui/material';
      import { useNavigate } from 'react-router-dom';
      import { Box } from '@mui/system';
      import React from 'react';
      import { PRIMARY } from '../../../shared/css/theme';
      import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
      import { CustomInput } from '../../../shared/components/inputs/CustomInput';
      import { Title } from '../../../shared/components/typography/Titles';
      
      /**
       * @returns {JSX.Element} - Component.
       */
      export const Update${moduleName}View: React.FC = () => {
        const navigate = useNavigate();
        return (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb="30px">
                <Box
                  display="flex"
                  justifyContent="space-between"
                  onClick={() => navigate(-1)}
                  alignItems="center">
                  <IconButton>
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography
                    sx={{ color: '#171D1C', fontSize: '18px', fontWeight: 500 }}>
                    Back
                  </Typography>
                </Box>

                <Button
                  sx={{ background: PRIMARY, float: 'right', margin: '20px' }}
                  variant="contained">
                  Update
                </Button>
              </Box>

              <Box
                sx={{
                  width: '100%',
                  borderBottom: '0.5px solid #C4C4C4',
                  marginBottom: '20px',
                }}
              />
      
              <Grid container spacing={1}>
                ${textfields}
              </Grid>
              
            </CardContent>
          </Card>
        );
      };
    `;
}