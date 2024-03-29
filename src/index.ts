import logger from 'jet-logger';
import server from './server';


// Constants
const serverStartMsg = 'Express server started on port: ',
        port = (process.env.PORT || 3000);

// Start server
(async () => {
    (await server).listen(port, () => {
        logger.info(serverStartMsg + port);
    });
})();
