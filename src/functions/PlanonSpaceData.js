const { app, HttpResponse } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const Regex = require("regex");

app.http("ReservationUnitID", {
  methods: ["GET"],
  authLevel: "function",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    //Get API key from request headers and test against expected key
    const requestApiKey = request.headers.get("x-functions-key");
    context.log("API KEY", requestApiKey);
    context.log("Request Headers:", request.headers);

    //load env variables from .env file
    require("dotenv").config();

    // Get the endpoint, key, database ID, and container ID from environment variables
    const endpoint = process.env.COSMOS_URI;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE;
    const containerId = process.env.COSMOS_CONTAINER;
    const expectedApiKey = process.env.API_DEFAULT_KEY;
    context.log("Expected Headers:", process.env.API_DEFAULT_KEY);

    //Create a new cosmos client instance using the endpoint and key
    const client = new CosmosClient({ endpoint: endpoint, key: key });

    //Get a reference to the database using the database ID
    const database = client.database(databaseId);

    //Get a reference to the container using the container ID
    const container = database.container(containerId);

    // Get the page size and page number from query parameters
    const pageSize = parseInt(request.headers.get("X-Page-Size")) || 10; // Default to 10 items per page
    const pageNumber = parseInt(request.headers.get("X-Page-Number")) || 1; // Default to page 1

    // Calculate the skip count based on page size and page number
    const skipCount = (pageNumber - 1) * pageSize;

    if (!requestApiKey || requestApiKey !== expectedApiKey) {
      return {
        status: 401,
        body: JSON.stringify({
          err: "Not Authorised. Missing or invalid API Key",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // if (context.res.status === 401) {
    //   return {
    //     status: 401,
    //     body: JSON.stringify({
    //       err: "Not Authorised. Missing or invalid API Key",
    //     }),
    //     headers: { "Content-Type": "application/json" },
    //   };
    // }

    //Create an object to build queries from. 'parameters' array used to append WHERE clauses onto query. Now including specific page of data.
    const querySpec = {
      query: "SELECT * FROM c ",
      parameters: [],
      options: {
        maxItemCount: pageSize, // Limit the numer of items per page
        continuation: request.query.get("continuation"), //Use the continuation token to retrieve the next page
      },
    };

    //Create an object to count the number of records returned
    const countSpec = {
      query: "SELECT VALUE COUNT(1) FROM c",
      parameters: [],
    };

    //initialise query params array
    const queryParams = [];

    //Obtain id number as variable ('result.query.eventid' didn't work for some reason so this is a workaround)
    const id = request.query.get("id");

    //Query for ID
    if (id) {
      queryParams.push("c.id = @id");
      querySpec.parameters.push({ name: "@id", value: id });
      countSpec.parameters.push({ name: "@id", value: request.query.id });
    }

    //Build the queries by combining the WHERE clauses and appending them to querySpec.query
    if (queryParams.length > 0) {
      const whereClause = queryParams.join(" AND ");
      querySpec.query += `WHERE ${whereClause}`;
    } else {
      querySpec.query += `WHERE 1 = 1`;
    }

    // Counter
    if (queryParams.length > 0) {
      countSpec.query += ` WHERE ${queryParams.join(" AND ")}`;
    } else {
      countSpec.query += " WHERE 1 = 1 "; // If no query parameters were included, return all documents`
    }
    countSpec.query += ` AND c.header.operation <> "D" `;
    console.log(countSpec.query);
    const { resources: count } = await container.items
      .query(countSpec)
      .fetchAll();

    const totalrows = count[0];

    // Calculate the total number of pages based on the page size and total number of documents
    const totalpages = Math.ceil(totalrows / pageSize);

    //Clause to exclude deleted records from results
    querySpec.query += ` AND c.header.operation <> "D" `;
    console.log("querySpec", querySpec);

    // Add a skip clause to start from the right page
    querySpec.query += ` OFFSET ${skipCount} LIMIT ${pageSize}`;

    //define regex pattern for queries
    const re = new RegExp("id=\\d{1,30}-RESERVATIONUNIT$");

    //test regex pattern and return error if query doesn't match
    const regTest = re.test(request.url);
    console.log("URL", request.url);
    console.log("REGEX RESULT", regTest);

    if (!regTest) {
      return {
        status: 400,
        body: JSON.stringify({
          err: "Invalid request. The URL does not match the expected pattern.",
        }),
        headers: { "Content-Type": "application/json" },
      };
    } else {
      // Execute the query and get the resulting documents as an array of resources
      const { resources, headers } = await container.items
        .query(querySpec)
        .fetchAll();

      // Set up a response object with pagination headers
      const response = {
        body: JSON.stringify(resources),
        headers: {
          "Content-Type": "application/json",
          "X-Total-Count": totalrows,
          "X-Page-Size": pageSize,
          "X-Page-Number": pageNumber,
          "X-Page-Count": totalpages,
        },
      };

      const status = response.status;
      context.log("STATUS", status);

      // Return the response
      return response;
    }
  },
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.http("ReservationUnitFull", {
  methods: ["GET"],
  authLevel: "function",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);
    context.log("HTTP STATUS", context.Response.StatusCode);

    //Get API key from request headers and test against expected key
    const requestApiKey = request.headers.get("x-functions-key");
    context.log("API KEY", requestApiKey);
    context.log("Request Headers:", request.headers);

    //load env variables from .env file
    require("dotenv").config();

    // Get the endpoint, key, database ID, and container ID from environment variables
    const endpoint = process.env.COSMOS_URI;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE;
    const containerId = process.env.COSMOS_CONTAINER;
    const expectedApiKey = process.env.API_DEFAULT_KEY;
    context.log("Expected Headers:", process.env.API_DEFAULT_KEY);

    //Create a new cosmos client instance using the endpoint and key
    const client = new CosmosClient({ endpoint: endpoint, key: key });

    //Get a reference to the database using the database ID
    const database = client.database(databaseId);

    //Get a reference to the container using the container ID
    const container = database.container(containerId);

    context.log("page size", request.query.get("pageSize"));

    //count number of row in the container
    const countSpec = {
      query: "SELECT VALUE COUNT(1) FROM c",
      parameters: [],
    };

    // Get the page size and page number from query parameters
    const pageSize = parseInt(request.headers.get("X-Page-Size")) || 10; // Default to 10 items per page
    const pageNumber = parseInt(request.headers.get("X-Page-Number")) || 1; // Default to page 1

    // Calculate the skip count based on page size and page number
    const skipCount = (pageNumber - 1) * pageSize;

    //Create an object to build queries from.
    const querySpec = { query: "SELECT * FROM c" };

    //Clause to exclude deleted records from results
    querySpec.query += ` WHERE c.header.operation <> "D" `;
    console.log("querySpec", querySpec);

    // Add a skip clause to start from the right page
    querySpec.query += ` OFFSET ${skipCount} LIMIT ${pageSize}`;

    // Execute the query and get the resulting documents as an array of resources
    const { resources, headers } = await container.items
      .query(querySpec)
      .fetchAll();

    // Count the number of records in container
    const { resources: count } = await container.items
      .query(countSpec)
      .fetchAll();
    const totalrows = count[0];

    // Calculate the total number of pages based on the page size and total number of documents
    const totalpages = Math.ceil(totalrows / pageSize);

    // Set up a response object with pagination headers
    const response = {
      body: JSON.stringify(resources),
      headers: {
        "Content-Type": "application/json",
        "X-Total-Count": totalrows,
        "X-Page-Size": pageSize,
        "X-Page-Number": pageNumber,
        "X-Page-Count": totalpages,
      },
    };

    // Return the response
    return response;
  },
});
