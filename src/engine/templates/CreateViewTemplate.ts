export const buildCreateViewTemplate = (
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
      import truckImg from '../../../shared/assets/images/bro.png';
      import { PRIMARY } from '../../../shared/css/theme';
      import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
      import { CustomInput } from '../../../shared/components/inputs/CustomInput';
      import { Title } from '../../../shared/components/typography/Titles';
      
      /**
       * @returns {JSX.Element} - Component.
       */
      export const Create${moduleName}View: React.FC = () => {
        const navigate = useNavigate();
        return (
          <Box padding="40px">
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb="15px">
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
                    Create
                  </Button>
                </Box>

              <Box
                sx={{
                width: '100%',
                borderBottom: '0.5px solid #C4C4C4',
                marginBottom: '20px',
                }}
              />
                <Grid container spacing={2}>
                  {/* left side image */}
                  <Grid item md={6}>
                    <img
                      src={truckImg}
                      alt="Truck img"
                      style={{
                        display: 'block',
                        width: '100%',
                      }}
                    />
                  </Grid>
                  {/* Right side, form */}
                  <Grid item md={6}>
                    <Box padding="20px">
                      <Grid container spacing={2}>
                        ${textfields}
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
      };
    `;
}