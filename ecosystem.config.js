module.exports = {
   /**
    * Application configuration section
    * http://pm2.keymetrics.io/docs/usage/application-declaration/
    */
   apps: [
      // First application
      {
         name: 'arta-payment',
         script: 'dist/main.js',
         watch: true,
         env: {
            COMMON_VARIABLE: 'true',
            PORT: 5010
         },
         env_production: {
            NODE_ENV: 'production'
         }
      }
   ]
};
