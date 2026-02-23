FROM node:20-alpine

WORKDIR /app

# Install dependencies separately
COPY package*.json ./
RUN npm install

# Copy rest of project
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]