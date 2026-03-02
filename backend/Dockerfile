FROM node:20

WORKDIR /app

# Install wrangler globally
RUN npm install -g wrangler

EXPOSE 8787

CMD sh -c "npm install && wrangler dev --ip 0.0.0.0 --port 8787 --local"
 