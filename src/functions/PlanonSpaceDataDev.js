const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const Regex = require("regex");

app.http("PlanonSpaceDataDev", {
  methods: ["GET"],
  authLevel: "function",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    //load env variables from .env file
    require("dotenv").config();

    // Get the endpoint, key, database ID, and container ID from environment variables
    const endpoint = process.env.COSMOS_URI;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE;
    const containerId = process.env.COSMOS_CONTAINER;

    //Create a new cosmos client instance using the endpoint and key
    const client = new CosmosClient({ endpoint: endpoint, key: key });

    //Get a reference to the database using the database ID
    const database = client.database(databaseId);
    // console.log('database', database)

    //Get a reference to the container using the container ID
    const container = database.container(containerId);
    // console.log('container', container)

    //Create an object to build queries from. 'parameters' array used to append WHERE clauses onto query.
    const querySpec = {
      query: "SELECT * FROM c ",
      parameters: [],
    };

    //initialise query params array
    const queryParams = [];

    // console.log("REQUEST QUERY", request.query)
    // console.log("REQUEST EVENTID", request.query.eventid)
    // console.log('EVENTID', eventid)

    //Obtain id number as variable ('result.query.eventid' didn't work for some reason so this is a workaround)
    const id = request.query.get("id");

    //Query for ID
    if (id) {
      queryParams.push("c.id = @id");
      querySpec.parameters.push({
        name: "@id",
        value: id,
      });
    }

    //Build the queries by combining the WHERE clauses and appending them to querySpec.query
    if (queryParams.length > 0) {
      const whereClause = queryParams.join(" AND ");
      querySpec.query += `WHERE ${whereClause}`;
    } else {
      querySpec.query += `WHERE 1 = 1`;
    }

    //Clause to exclude deleted records from results
    querySpec.query += ` AND c.header.operation <> "D" `;
    console.log("querySpec", querySpec);

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
      const { resources } = await container.items.query(querySpec).fetchAll();
      //console.log('RESOURCES', resources)

      //set up response data. define it as json content type
      return { body: `Resources: ${JSON.stringify(resources)}` };
    }
  },
});
