import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { getAccessToken } from './auth/http';
/**
 * HTTP actions for handling OAuth redirects and other HTTP-based functionality
 */

// Create an HTTP router
const http = httpRouter();

http.route({
  path: '/auth/at',
  method: 'POST',
  handler: getAccessToken,
});

http.route({
  method: "OPTIONS",
  path: '/auth/at',
  handler: httpAction(async () => {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }),
})

// Register and export the HTTP router
export default http;
