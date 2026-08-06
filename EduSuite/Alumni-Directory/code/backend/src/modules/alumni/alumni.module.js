import alumniRoutes from "./alumni.routes.js";

const alumniModule = {
  key: "alumni",
  name: "Alumni Directory",
  code: "STL-ALU",
  releaseClassification: "GATED",
  basePath: "/api/v1/alumni",
  router: alumniRoutes
};

export default alumniModule;