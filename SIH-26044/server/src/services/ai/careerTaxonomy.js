// server/src/services/ai/careerTaxonomy.js
/**
 * AICP Career Taxonomy & Skill Dependency Graph
 *
 * Provides a canonical registry of supported educational and industry career roles,
 * expected core and secondary skills, skill prerequisites, difficulty levels,
 * and role validation that naturally rejects non-career/arbitrary inputs.
 */

export const CAREER_ROLES = {
  'Frontend Developer': {
    title: 'Frontend Developer',
    category: 'Web & Software Engineering',
    aliases: [
      'frontend', 'front end', 'front-end', 'frontend developer', 'frontend engineer',
      'react developer', 'react dev', 'web frontend', 'ui developer', 'ui engineer',
      'client-side developer'
    ],
    description: 'Designs and builds responsive, interactive client-side web applications.',
    coreSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'REST APIs', 'Git'],
    secondarySkills: ['TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'Testing'],
    nextCareers: ['Full Stack Developer', 'Frontend Architect', 'Mobile Developer'],
  },

  'Backend Developer': {
    title: 'Backend Developer',
    category: 'Web & Software Engineering',
    aliases: [
      'backend', 'back end', 'back-end', 'backend developer', 'backend engineer',
      'node developer', 'api developer', 'server developer', 'server engineer',
      'java backend', 'python backend'
    ],
    description: 'Architects, develops, and maintains server-side logic, databases, and APIs.',
    coreSkills: ['Node.js', 'Express', 'SQL', 'REST APIs', 'MongoDB', 'Git'],
    secondarySkills: ['Docker', 'Redis', 'Microservices', 'PostgreSQL', 'CI/CD'],
    nextCareers: ['Full Stack Developer', 'DevOps Engineer', 'System Architect'],
  },

  'Full Stack Developer': {
    title: 'Full Stack Developer',
    category: 'Web & Software Engineering',
    aliases: [
      'full stack', 'fullstack', 'full-stack', 'full stack developer', 'full stack engineer',
      'mern developer', 'mean developer', 'web developer', 'full stack web developer'
    ],
    description: 'Builds complete end-to-end web applications across client interfaces and server infrastructure.',
    coreSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'REST APIs', 'Git'],
    secondarySkills: ['TypeScript', 'Docker', 'Tailwind CSS', 'Next.js', 'CI/CD'],
    nextCareers: ['Technical Lead', 'Software Architect', 'Engineering Manager'],
  },

  'Data Analyst': {
    title: 'Data Analyst',
    category: 'Data & Artificial Intelligence',
    aliases: [
      'data analyst', 'data analytics', 'bi analyst', 'business intelligence analyst',
      'analytics consultant', 'reporting analyst', 'junior data analyst'
    ],
    description: 'Extracts, cleans, and analyzes structured data to generate actionable business insights and dashboards.',
    coreSkills: ['Python', 'SQL', 'Excel', 'Data Analysis', 'Data Visualization', 'Statistics'],
    secondarySkills: ['Power BI', 'Tableau', 'Pandas', 'NumPy', 'Business Intelligence'],
    nextCareers: ['Data Scientist', 'BI Architect', 'Data Engineer'],
  },

  'Data Scientist': {
    title: 'Data Scientist',
    category: 'Data & Artificial Intelligence',
    aliases: [
      'data scientist', 'data science', 'ds', 'applied scientist', 'quantitative analyst',
      'lead data scientist'
    ],
    description: 'Develops statistical experiments, feature engineering, and predictive ML models on complex datasets.',
    coreSkills: ['Python', 'Statistics', 'Pandas', 'NumPy', 'SQL', 'Machine Learning', 'Scikit-learn', 'Model Evaluation', 'Data Visualization'],
    secondarySkills: ['Deep Learning', 'Apache Spark', 'Feature Engineering', 'TensorFlow', 'PyTorch'],
    nextCareers: ['Machine Learning Engineer', 'AI Research Scientist', 'Head of Data Science'],
  },

  'Machine Learning Engineer': {
    title: 'Machine Learning Engineer',
    category: 'Data & Artificial Intelligence',
    aliases: [
      'ml engineer', 'machine learning engineer', 'ai engineer', 'ai/ml engineer',
      'artificial intelligence engineer', 'deep learning engineer', 'ai developer',
      'ml developer', 'mlops engineer'
    ],
    description: 'Designs, trains, deploys, and optimizes production-grade AI/ML pipelines and models.',
    coreSkills: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'Scikit-learn', 'Model Evaluation', 'Git'],
    secondarySkills: ['Docker', 'FastAPI', 'MLOps', 'Model Deployment', 'NLP', 'Computer Vision', 'Generative AI'],
    nextCareers: ['AI Solutions Architect', 'ML Infrastructure Lead', 'AI Research Scientist'],
  },

  'Cloud Engineer': {
    title: 'Cloud Engineer',
    category: 'Cloud & Infrastructure',
    aliases: [
      'cloud engineer', 'cloud architect', 'aws engineer', 'azure engineer',
      'cloud solutions architect', 'cloud developer', 'cloud administrator'
    ],
    description: 'Provisions, secures, and automates scalable enterprise multi-cloud infrastructures.',
    coreSkills: ['AWS', 'Linux', 'Docker', 'Networking', 'Git'],
    secondarySkills: ['Kubernetes', 'Terraform', 'CI/CD', 'Azure', 'Google Cloud', 'Cloud Security'],
    nextCareers: ['DevOps Engineer', 'Cloud Architect', 'Site Reliability Engineer'],
  },

  'DevOps Engineer': {
    title: 'DevOps Engineer',
    category: 'Cloud & Infrastructure',
    aliases: [
      'devops', 'devops engineer', 'sre', 'site reliability engineer', 'platform engineer',
      'infrastructure engineer', 'build and release engineer'
    ],
    description: 'Automates development workflows, CI/CD pipelines, container orchestration, and system reliability.',
    coreSkills: ['Linux', 'Git', 'Docker', 'CI/CD', 'AWS', 'Bash/Shell', 'Python'],
    secondarySkills: ['Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'Monitoring'],
    nextCareers: ['Cloud Architect', 'Principal SRE', 'Platform Director'],
  },

  'Cybersecurity Analyst': {
    title: 'Cybersecurity Analyst',
    category: 'Security & Systems',
    aliases: [
      'cybersecurity', 'cyber security', 'cybersecurity analyst', 'infosec',
      'information security specialist', 'soc analyst', 'security analyst',
      'network security engineer', 'ethical hacker', 'penetration tester'
    ],
    description: 'Monitors, protects, and defends digital assets and networks against cyber threats and vulnerabilities.',
    coreSkills: ['Networking', 'Linux', 'Cybersecurity', 'Network Security', 'Information Security', 'Python'],
    secondarySkills: ['Ethical Hacking', 'Penetration Testing', 'SIEM', 'SOC Analysis', 'Cryptography'],
    nextCareers: ['Security Architect', 'Chief Information Security Officer (CISO)', 'Penetration Tester'],
  },

  'Mobile Developer': {
    title: 'Mobile Developer',
    category: 'Mobile Engineering',
    aliases: [
      'mobile developer', 'mobile engineer', 'android developer', 'ios developer',
      'flutter developer', 'react native developer', 'app developer'
    ],
    description: 'Creates performant, cross-platform and native mobile applications for iOS and Android devices.',
    coreSkills: ['Java', 'Kotlin', 'React Native', 'Mobile UI', 'REST APIs', 'Git'],
    secondarySkills: ['Swift', 'Flutter', 'Firebase', 'State Management', 'SQLite'],
    nextCareers: ['Lead Mobile Architect', 'Full Stack Developer', 'Product Engineer'],
  },

  'UI/UX Designer': {
    title: 'UI/UX Designer',
    category: 'Design & Product',
    aliases: [
      'ui/ux designer', 'ui designer', 'ux designer', 'product designer',
      'ux/ui', 'user experience designer', 'user interface designer', 'interaction designer'
    ],
    description: 'Conducts user research and designs intuitive wireframes, mockups, and interactive design systems.',
    coreSkills: ['Figma', 'UI Design', 'Wireframing', 'Prototyping', 'User Research', 'Design Systems'],
    secondarySkills: ['Usability Testing', 'HTML', 'CSS', 'Information Architecture'],
    nextCareers: ['Lead Product Designer', 'Design Systems Architect', 'Head of Design'],
  },

  'QA Engineer': {
    title: 'QA Engineer',
    category: 'Quality Engineering',
    aliases: [
      'qa engineer', 'quality assurance', 'test engineer', 'automation engineer',
      'sdet', 'software test engineer', 'qa analyst'
    ],
    description: 'Ensures software quality and robustness through test automation, regression suites, and bug analysis.',
    coreSkills: ['Software Testing', 'Manual Testing', 'Automated Testing', 'Selenium', 'Python', 'Git'],
    secondarySkills: ['API Testing', 'Postman', 'Performance Testing', 'CI/CD', 'Cypress'],
    nextCareers: ['Lead SDET', 'DevOps Engineer', 'Release Manager'],
  },

  'Data Engineer': {
    title: 'Data Engineer',
    category: 'Data & Artificial Intelligence',
    aliases: [
      'data engineer', 'database administrator', 'dba', 'big data engineer',
      'etl developer', 'data platform engineer'
    ],
    description: 'Designs, builds, and maintains data pipelines, warehouses, and storage architectures.',
    coreSkills: ['SQL', 'PostgreSQL', 'MySQL', 'Python', 'Database Design', 'ETL Pipelines'],
    secondarySkills: ['Apache Spark', 'Apache Kafka', 'Redis', 'MongoDB', 'Data Warehousing'],
    nextCareers: ['Data Architect', 'Big Data Lead', 'Cloud Infrastructure Engineer'],
  },

  'Software Developer': {
    title: 'Software Developer',
    category: 'Web & Software Engineering',
    aliases: [
      'software developer', 'software engineer', 'swe', 'sde', 'programmer',
      'application developer', 'software associate', 'junior software developer'
    ],
    description: 'Designs, builds, and maintains scalable software systems and algorithmic solutions.',
    coreSkills: ['Data Structures', 'Algorithms', 'JavaScript', 'Python', 'SQL', 'Git', 'OOP'],
    secondarySkills: ['REST APIs', 'Docker', 'Testing', 'System Design', 'CI/CD'],
    nextCareers: ['Senior Software Engineer', 'System Architect', 'Tech Lead'],
  },
}

/**
 * Skill Dependency & Metadata Graph
 * Defines prerequisites, learning difficulty, category, and learning topics for each ontology skill.
 */
export const SKILL_DEPENDENCY_GRAPH = {
  // Web & Frontend
  HTML: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Frontend',
    topics: {
      beginner: ['Semantic HTML5 elements', 'Forms, inputs & validation', 'Document layout & SEO meta tags'],
      intermediate: ['Accessibility (a11y) & ARIA', 'Audio/video elements & canvas', 'Web storage APIs'],
      advanced: ['Web components & shadow DOM', 'Performance optimization & DOM rendering'],
      project: 'Build an accessible, semantic portfolio showcase webpage',
    },
  },
  CSS: {
    prerequisites: ['HTML'],
    difficulty: 'Beginner',
    category: 'Frontend',
    topics: {
      beginner: ['Box model, selectors & specificity', 'Flexbox layouts & alignment', 'Media queries & responsive design'],
      intermediate: ['CSS Grid layouts', 'Transitions, transforms & animations', 'Custom properties (variables)'],
      advanced: ['BEM methodology & architecture', 'CSS performance & GPU acceleration'],
      project: 'Build a multi-device responsive landing page with custom CSS animations',
    },
  },
  JavaScript: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Programming',
    topics: {
      beginner: ['Variables, scopes & data types', 'Loops, functions & arrow syntax', 'DOM manipulation & events'],
      intermediate: ['Promises, async/await & fetch API', 'ES6+ modules, destructuring & spread', 'Closures & lexical scope'],
      advanced: ['Prototypes, event loop & concurrency', 'Memory management & performance profiling'],
      project: 'Build an interactive client-side task & budget dashboard with local persistence',
    },
  },
  React: {
    prerequisites: ['JavaScript', 'HTML', 'CSS'],
    difficulty: 'Intermediate',
    category: 'Frontend',
    topics: {
      beginner: ['JSX syntax & component decomposition', 'Props, state & event handling', 'Rendering lists & conditional UI'],
      intermediate: ['useEffect, useRef & custom hooks', 'Context API & compound components', 'React Router client routing'],
      advanced: ['React 18 concurrent features', 'Performance profiling, memo & code splitting', 'State management with Redux/Zustand'],
      project: 'Build a feature-rich job application tracker with search, filters, and local state management',
    },
  },
  TypeScript: {
    prerequisites: ['JavaScript'],
    difficulty: 'Intermediate',
    category: 'Programming',
    topics: {
      beginner: ['Basic types, interfaces & type aliases', 'Function typing & optional params', 'Union and intersection types'],
      intermediate: ['Generics in functions & classes', 'Type narrowing & utility types (Partial, Pick, Omit)', 'tsconfig configurations'],
      advanced: ['Conditional types, mapped types & infer', 'Declaration files (.d.ts) & library typing'],
      project: 'Convert an existing JavaScript project into a strictly typed TypeScript application',
    },
  },
  'Tailwind CSS': {
    prerequisites: ['CSS', 'HTML'],
    difficulty: 'Beginner',
    category: 'Frontend',
    topics: {
      beginner: ['Utility-first concepts & spacing', 'Typography, colors & responsive prefixes', 'Flexbox & grid utilities'],
      intermediate: ['Component extraction with @apply', 'Dark mode & state variants (hover, focus)', 'Customizing tailwind.config.js'],
      advanced: ['Creating custom plugins & arbitrary values', 'Optimizing bundle size with PurgeCSS'],
      project: 'Style a modern dashboard interface completely using Tailwind CSS utilities',
    },
  },
  'Next.js': {
    prerequisites: ['React', 'JavaScript'],
    difficulty: 'Intermediate',
    category: 'Frontend',
    topics: {
      beginner: ['App router & directory conventions', 'Server vs client components', 'Static routing & dynamic segments'],
      intermediate: ['Server-side data fetching & caching', 'API route handlers & server actions', 'Image and font optimization'],
      advanced: ['Middleware, authentication & edge runtime', 'Incremental Static Regeneration (ISR)'],
      project: 'Build an SEO-optimized blog and portfolio platform with Next.js App Router',
    },
  },
  Redux: {
    prerequisites: ['React', 'JavaScript'],
    difficulty: 'Intermediate',
    category: 'Frontend',
    topics: {
      beginner: ['Redux store concepts, actions & reducers', 'Immutability & one-way data flow'],
      intermediate: ['Redux Toolkit (RTK) & createSlice', 'Async thunks & RTK Query data fetching'],
      advanced: ['Redux middleware & DevTools profiling', 'Normalizing complex state structures'],
      project: 'Build an e-commerce shopping cart and checkout flow with Redux Toolkit',
    },
  },

  // Backend & Databases
  'Node.js': {
    prerequisites: ['JavaScript'],
    difficulty: 'Intermediate',
    category: 'Backend',
    topics: {
      beginner: ['Node.js runtime & event loop basics', 'CommonJS vs ES modules', 'Built-in modules (fs, path, http)'],
      intermediate: ['npm packaging & environment configs', 'Streams, buffers & event emitters', 'Asynchronous file and network I/O'],
      advanced: ['Worker threads & clustering', 'Memory profiling, debugging & error handling'],
      project: 'Build a CLI developer tool and local HTTP file-server in Node.js',
    },
  },
  Express: {
    prerequisites: ['Node.js', 'JavaScript'],
    difficulty: 'Intermediate',
    category: 'Backend',
    topics: {
      beginner: ['Express application setup & routing', 'Handling request body, query & params', 'Static file serving'],
      intermediate: ['Custom middleware & error handling pipeline', 'CORS, security headers & rate limiting', 'JWT authentication middleware'],
      advanced: ['Modular router architecture & controllers', 'Unit and integration testing with Supertest'],
      project: 'Build a robust RESTful API with authentication, validation, and structured error responses',
    },
  },
  'REST APIs': {
    prerequisites: ['JavaScript'],
    difficulty: 'Intermediate',
    category: 'Backend',
    topics: {
      beginner: ['HTTP methods (GET, POST, PUT, DELETE)', 'Status codes & standard headers', 'JSON payloads & URL design'],
      intermediate: ['Pagination, sorting & filtering params', 'Authentication schemes (Bearer token, API keys)', 'Versioning & documentation (Swagger/OpenAPI)'],
      advanced: ['Idempotency, caching (ETags) & rate limiting', 'API security & input sanitization'],
      project: 'Design and document a complete OpenAPI 3.0 specification for an e-commerce API',
    },
  },
  SQL: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Database',
    topics: {
      beginner: ['SELECT, WHERE, ORDER BY, LIMIT', 'INSERT, UPDATE, DELETE statements', 'Primary and Foreign keys'],
      intermediate: ['INNER, LEFT, RIGHT and FULL JOINs', 'GROUP BY, HAVING & aggregate functions', 'Subqueries and Common Table Expressions (CTEs)'],
      advanced: ['Window functions (ROW_NUMBER, RANK, LEAD/LAG)', 'Query optimization, indexes & execution plans', 'ACID transactions & locking'],
      project: 'Design a normalized relational schema and write complex analytical queries for student analytics',
    },
  },
  PostgreSQL: {
    prerequisites: ['SQL'],
    difficulty: 'Intermediate',
    category: 'Database',
    topics: {
      beginner: ['Postgres data types (UUID, JSONB, arrays)', 'psql command-line client & schemas'],
      intermediate: ['JSONB indexing (GIN/GiST)', 'Full-text search in PostgreSQL', 'Connection pooling with PgBouncer'],
      advanced: ['Table partitioning & replication', 'Stored procedures & PL/pgSQL triggers'],
      project: 'Build a high-performance PostgreSQL backend with JSONB semi-structured event logging',
    },
  },
  MySQL: {
    prerequisites: ['SQL'],
    difficulty: 'Beginner',
    category: 'Database',
    topics: {
      beginner: ['MySQL installation & Workbench usage', 'Basic CRUD operations & constraints'],
      intermediate: ['InnoDB engine & foreign keys', 'Indexes, EXPLAIN statements & slow query logs'],
      advanced: ['Master-slave replication & backups', 'Stored routines and event scheduler'],
      project: 'Configure and optimize a relational database schema for an order processing system',
    },
  },
  MongoDB: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Database',
    topics: {
      beginner: ['NoSQL concepts, collections & BSON documents', 'Basic CRUD operations with mongosh', 'Document structure & embed vs reference'],
      intermediate: ['Mongoose schemas, validation & hooks', 'Aggregation framework ($match, $group, $project)', 'Indexing strategies for query performance'],
      advanced: ['Transactions in replica sets', 'Schema design patterns for massive scalability'],
      project: 'Build a content management system database with Mongoose relationships and aggregations',
    },
  },
  Redis: {
    prerequisites: ['Node.js'],
    difficulty: 'Intermediate',
    category: 'Database',
    topics: {
      beginner: ['In-memory key-value concepts & data types (strings, lists, sets, hashes)'],
      intermediate: ['Session storage & caching strategies (cache-aside, TTL)', 'Rate limiting with Redis'],
      advanced: ['Pub/Sub messaging & Redis streams', 'Redis clustering & persistence (RDB/AOF)'],
      project: 'Implement an API response caching layer and rate limiter using Redis',
    },
  },
  Microservices: {
    prerequisites: ['REST APIs', 'Docker'],
    difficulty: 'Advanced',
    category: 'Backend',
    topics: {
      beginner: ['Monolith vs Microservices tradeoffs', 'Service boundaries & domain-driven design'],
      intermediate: ['API Gateways, service discovery & inter-service communication', 'Event-driven architecture with message queues'],
      advanced: ['Distributed tracing, Saga pattern & circuit breakers', 'Zero-downtime canary deployments'],
      project: 'Refactor a monolithic service into two communicating microservices via an API gateway',
    },
  },

  // Programming & Algorithms
  Python: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Programming',
    topics: {
      beginner: ['Variables & data types', 'Loops & conditionals', 'Functions & modules', 'Lists, dicts, sets'],
      intermediate: ['OOP in Python', 'File I/O & exceptions', 'List comprehensions & generators', 'Virtual environments & pip'],
      advanced: ['Decorators & context managers', 'Async/await in Python', 'Performance profiling & C-extensions'],
      project: 'Build a CLI task manager with SQLite persistence and automated unit tests',
    },
  },
  Java: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Programming',
    topics: {
      beginner: ['Java syntax, primitives & control flow', 'Classes, objects & inheritance', 'Encapsulation & polymorphism'],
      intermediate: ['Java Collections framework', 'Generics & exception handling', 'File I/O & lambda expressions'],
      advanced: ['Multithreading & concurrency (java.util.concurrent)', 'JVM internals, memory management & garbage collection'],
      project: 'Build a multi-threaded banking transaction simulator with concurrent safety',
    },
  },
  'Spring Boot': {
    prerequisites: ['Java'],
    difficulty: 'Intermediate',
    category: 'Backend',
    topics: {
      beginner: ['Dependency injection & inversion of control', 'Spring Boot starters & auto-configuration', 'Building REST controllers with @RestController'],
      intermediate: ['Spring Data JPA & Hibernate ORM', 'Validation, exception handling & DTO patterns', 'Spring Security with JWT'],
      advanced: ['Actuator monitoring, microservice integration', 'Spring Cloud & configuration server'],
      project: 'Build a production-ready enterprise REST API with Spring Boot, JPA, and JWT authentication',
    },
  },
  'Data Structures': {
    prerequisites: ['Python'],
    difficulty: 'Beginner',
    category: 'Computer Science',
    topics: {
      beginner: ['Arrays, strings & complexity analysis (Big-O)', 'Linked lists (singly & doubly linked)', 'Stacks and queues'],
      intermediate: ['Hash maps & hash tables', 'Binary search trees & traversals', 'Heaps and priority queues'],
      advanced: ['Tries, balanced trees (AVL/Red-Black)', 'Graphs & traversal algorithms (BFS, DFS)'],
      project: 'Implement a custom in-memory caching engine using Doubly Linked List and Hash Map (LRU Cache)',
    },
  },
  Algorithms: {
    prerequisites: ['Data Structures'],
    difficulty: 'Intermediate',
    category: 'Computer Science',
    topics: {
      beginner: ['Binary search & two-pointer technique', 'Sorting algorithms (Merge sort, Quick sort)'],
      intermediate: ['Recursion & backtracking', 'Greedy algorithms', 'Breadth-First & Depth-First Search'],
      advanced: ['Dynamic Programming (memoization & tabulation)', 'Shortest path algorithms (Dijkstra, Bellman-Ford)'],
      project: 'Build an algorithmic route optimizer and maze solver visualizing BFS, DFS, and Dijkstra',
    },
  },

  // Data Science & AI
  Statistics: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Data & AI',
    topics: {
      beginner: ['Mean, median, mode & standard deviation', 'Probability basics & distributions (Normal, Binomial)'],
      intermediate: ['Hypothesis testing & p-values', 'Confidence intervals & z/t-tests', 'Correlation vs causation'],
      advanced: ['Bayesian inference & prior probabilities', 'ANOVA & regression diagnostics'],
      project: 'Perform rigorous statistical hypothesis testing on student engagement metrics',
    },
  },
  Pandas: {
    prerequisites: ['Python'],
    difficulty: 'Beginner',
    category: 'Data & AI',
    topics: {
      beginner: ['Series and DataFrame basics', 'Reading CSV, JSON & SQL data', 'Filtering, selecting & indexing'],
      intermediate: ['Handling missing values & data types', 'groupby aggregations & pivot tables', 'Merging, joining & concatenating'],
      advanced: ['Time series manipulation & resample', 'Optimizing memory usage with category types'],
      project: 'Clean, normalize, and analyze a raw 100,000-row real-world dataset using Pandas',
    },
  },
  NumPy: {
    prerequisites: ['Python'],
    difficulty: 'Beginner',
    category: 'Data & AI',
    topics: {
      beginner: ['N-dimensional arrays (ndarray)', 'Array indexing, slicing & broadcasting'],
      intermediate: ['Vectorized operations & universal functions', 'Matrix algebra & dot products'],
      advanced: ['Random sampling, linear algebra (linalg)', 'Memory layout (C vs Fortran order) & strides'],
      project: 'Implement linear regression from scratch using only NumPy vector operations',
    },
  },
  'Data Analysis': {
    prerequisites: ['Python', 'SQL'],
    difficulty: 'Beginner',
    category: 'Data & AI',
    topics: {
      beginner: ['Data collection & inspection', 'Data cleaning & outlier detection'],
      intermediate: ['Exploratory Data Analysis (EDA) workflows', 'Feature correlation analysis', 'KPI definitions & metrics tracking'],
      advanced: ['Root-cause analysis & cohort retention', 'Automating recurring data quality checks'],
      project: 'Conduct a comprehensive exploratory data analysis on real-world placement trends',
    },
  },
  'Data Visualization': {
    prerequisites: ['Python', 'Data Analysis'],
    difficulty: 'Beginner',
    category: 'Data & AI',
    topics: {
      beginner: ['Choosing the right chart types (bar, line, scatter, pie)', 'Matplotlib & Seaborn basics'],
      intermediate: ['Customizing color palettes, legends & annotations', 'Multi-panel subplots & distribution plots'],
      advanced: ['Interactive dashboards with Plotly/Dash', 'Visual storytelling & executive presentation design'],
      project: 'Build an interactive visual analytics dashboard presenting student performance insights',
    },
  },
  'Machine Learning': {
    prerequisites: ['Python', 'Statistics', 'Pandas', 'NumPy'],
    difficulty: 'Intermediate',
    category: 'Data & AI',
    topics: {
      beginner: ['Supervised vs unsupervised learning', 'Train/test split & baseline models', 'Linear and logistic regression'],
      intermediate: ['Decision trees & random forests', 'Feature engineering, scaling & encoding', 'Cross-validation & regularizations (L1/L2)'],
      advanced: ['Ensemble methods (XGBoost, LightGBM)', 'Clustering algorithms (K-Means, DBSCAN)', 'Model interpretability (SHAP values)'],
      project: 'Build an end-to-end student placement prediction model with feature selection and evaluation',
    },
  },
  'Scikit-learn': {
    prerequisites: ['Machine Learning', 'Python'],
    difficulty: 'Intermediate',
    category: 'Data & AI',
    topics: {
      beginner: ['Estimator, Transformer & Predictor API', 'Train-test split & standard scalers'],
      intermediate: ['Pipeline API & ColumnTransformer', 'GridSearchCV and RandomizedSearchCV', 'Evaluation metrics (ROC-AUC, F1, Confusion Matrix)'],
      advanced: ['Custom transformers & estimators', 'Handling imbalanced datasets with resamplers'],
      project: 'Construct a reusable Scikit-learn Pipeline with automated imputation, encoding, and tuning',
    },
  },
  'Model Evaluation': {
    prerequisites: ['Machine Learning', 'Statistics'],
    difficulty: 'Intermediate',
    category: 'Data & AI',
    topics: {
      beginner: ['Accuracy vs Precision vs Recall', 'Confusion matrix interpretation'],
      intermediate: ['F1-score, ROC curves & AUC score', 'Mean Squared Error (MSE), RMSE & MAE for regression'],
      advanced: ['K-Fold cross-validation & stratified splitting', 'Bias-variance tradeoff diagnostics & learning curves'],
      project: 'Benchmark 4 different classifiers with cross-validation and generate an evaluation report',
    },
  },
  'Deep Learning': {
    prerequisites: ['Machine Learning', 'Python', 'Statistics'],
    difficulty: 'Advanced',
    category: 'Data & AI',
    topics: {
      beginner: ['Perceptrons, multi-layer neural networks', 'Activation functions (ReLU, Sigmoid, Softmax)', 'Forward and backpropagation'],
      intermediate: ['Loss functions & optimizers (Adam, SGD)', 'Overfitting prevention (Dropout, Batch Normalization)', 'Convolutional Neural Networks (CNNs)'],
      advanced: ['Recurrent Neural Networks (RNNs/LSTMs)', 'Transformers & Self-Attention mechanisms'],
      project: 'Train a deep neural network on image classification with data augmentation and dropout',
    },
  },
  PyTorch: {
    prerequisites: ['Deep Learning', 'Python'],
    difficulty: 'Advanced',
    category: 'Data & AI',
    topics: {
      beginner: ['Tensors, autograd & GPU acceleration (cuda)', 'Dataset and DataLoader classes'],
      intermediate: ['Building nn.Module architectures', 'Custom training and validation loops', 'Saving and loading model checkpoints'],
      advanced: ['TorchVision fine-tuning & transfer learning', 'TorchScript, ONNX export & production deployment'],
      project: 'Implement and train a custom vision model using PyTorch with transfer learning',
    },
  },
  'Power BI': {
    prerequisites: ['Excel', 'SQL'],
    difficulty: 'Intermediate',
    category: 'Data & AI',
    topics: {
      beginner: ['Power BI Desktop interface & data imports', 'Creating cards, bar charts & table visuals'],
      intermediate: ['Power Query transformations & data modeling', 'DAX fundamentals (CALCULATE, RELATED, SUMX)'],
      advanced: ['Row-level security (RLS) & publishing to Power BI Service', 'Advanced DAX time intelligence'],
      project: 'Build an executive business dashboard with interactive KPI cards and drill-through filters',
    },
  },
  Excel: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Data & AI',
    topics: {
      beginner: ['Formulas (SUM, AVERAGE, COUNTIF)', 'Cell references (absolute vs relative)', 'Data sorting & filtering'],
      intermediate: ['VLOOKUP, XLOOKUP, INDEX & MATCH', 'Pivot tables and pivot charts', 'Conditional formatting & data validation'],
      advanced: ['Power Query in Excel for ETL', 'What-If analysis & basic VBA automation'],
      project: 'Create a comprehensive financial model and operational dashboard with Pivot Tables and XLOOKUP',
    },
  },

  // Cloud & DevOps
  Linux: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'DevOps',
    topics: {
      beginner: ['File navigation (cd, ls, pwd, cat)', 'File permissions (chmod, chown)', 'Process management (ps, top, kill)'],
      intermediate: ['Package management (apt, yum)', 'Networking commands (curl, netstat, ssh)', 'Text processing with grep, awk, sed'],
      advanced: ['Systemd services & cron automation', 'Linux performance troubleshooting (vmstat, iostat)'],
      project: 'Set up an automated backup and server health monitor shell script on Linux',
    },
  },
  Git: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'DevOps',
    topics: {
      beginner: ['git init, add, commit, status', 'git push, pull, clone & remotes', 'Creating and switching branches'],
      intermediate: ['git merge, rebase & resolving conflicts', 'git stash, reset & revert', 'Semantic commit messages & pull requests'],
      advanced: ['Interactive rebasing & bisecting bugs', 'Git hooks & submodule management'],
      project: 'Manage an open-source repository featuring multi-developer branching, PR reviews, and releases',
    },
  },
  Docker: {
    prerequisites: ['Linux'],
    difficulty: 'Intermediate',
    category: 'DevOps',
    topics: {
      beginner: ['What is containerization vs virtualization', 'docker run, ps, stop, pull', 'Dockerfile instructions (FROM, RUN, CMD)'],
      intermediate: ['Multi-stage Dockerfiles for minimal images', 'Docker volumes, networking & port mapping', 'docker-compose multi-container apps'],
      advanced: ['Container security & non-root users', 'Distroless images & Docker layer caching'],
      project: 'Containerize a full-stack Node.js + MongoDB + React application using docker-compose',
    },
  },
  Kubernetes: {
    prerequisites: ['Docker', 'Linux', 'Networking'],
    difficulty: 'Advanced',
    category: 'DevOps',
    topics: {
      beginner: ['Kubernetes architecture (control plane & nodes)', 'Pods, Deployments & ReplicaSets', 'kubectl commands and manifest files'],
      intermediate: ['Services (ClusterIP, NodePort, LoadBalancer)', 'ConfigMaps, Secrets & persistent storage (PVC)'],
      advanced: ['Ingress controllers, Helm chart packaging', 'HPA (Horizontal Pod Autoscaling) & zero-downtime rollouts'],
      project: 'Deploy and auto-scale a containerized microservice cluster with Kubernetes manifests',
    },
  },
  'CI/CD': {
    prerequisites: ['Git'],
    difficulty: 'Intermediate',
    category: 'DevOps',
    topics: {
      beginner: ['Continuous Integration vs Continuous Delivery', 'Automated test execution on commit'],
      intermediate: ['GitHub Actions workflows & syntax', 'Environment secrets, matrix builds & caching', 'Automated Docker image publishing'],
      advanced: ['Multi-environment staging/production pipelines', 'Canary & blue-green deployment strategies'],
      project: 'Build a production GitHub Actions CI/CD pipeline that runs tests, builds Docker images, and deploys',
    },
  },
  AWS: {
    prerequisites: ['Networking', 'Linux'],
    difficulty: 'Intermediate',
    category: 'Cloud',
    topics: {
      beginner: ['AWS Global Infrastructure & IAM roles', 'EC2 virtual servers & S3 bucket storage', 'AWS CLI configuration'],
      intermediate: ['VPC networking, subnets & security groups', 'AWS Lambda serverless functions & API Gateway', 'RDS relational database instances'],
      advanced: ['Infrastructure as Code with Terraform/CDK', 'Cost optimization, auto-scaling & CloudWatch telemetry'],
      project: 'Deploy a serverless REST API using AWS Lambda, API Gateway, and DynamoDB',
    },
  },

  // Security
  Networking: {
    prerequisites: [],
    difficulty: 'Beginner',
    category: 'Security',
    topics: {
      beginner: ['OSI and TCP/IP 7-layer models', 'IP addressing, subnetting & CIDR notation', 'DNS, DHCP & NAT basics'],
      intermediate: ['TCP vs UDP protocols, ports & sockets', 'HTTP/HTTPS, TLS handshake & certificates', 'Routing protocols & packet flow'],
      advanced: ['Packet analysis with Wireshark', 'Software-defined networking & firewall rules'],
      project: 'Capture and inspect network traffic with Wireshark to analyze HTTP and DNS communications',
    },
  },
  Cybersecurity: {
    prerequisites: ['Networking', 'Linux'],
    difficulty: 'Intermediate',
    category: 'Security',
    topics: {
      beginner: ['CIA Triad (Confidentiality, Integrity, Availability)', 'Common threats (phishing, malware, DDoS)', 'Basic password & MFA security'],
      intermediate: ['OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF)', 'Vulnerability assessment scanning (Nmap, Nessus)', 'Incident response lifecycle'],
      advanced: ['Threat hunting, SIEM log correlation', 'Security compliance frameworks (NIST, ISO 27001)'],
      project: 'Perform a comprehensive vulnerability audit on a web application against OWASP Top 10',
    },
  },
}

/**
 * Validates whether a target role string is a recognized educational or industry career path in AICP.
 * Does NOT use a hardcoded blacklist. Instead, checks membership against canonical roles and aliases.
 *
 * @param {string} rawRole - Target role entered by the student.
 * @returns {object} { isValid: boolean, canonicalRole: string, roleData: object, error?: string, message?: string, suggestedRoles?: string[] }
 */
export const validateRole = (rawRole = '') => {
  if (!rawRole || typeof rawRole !== 'string') {
    return {
      isValid: false,
      canonicalRole: null,
      roleData: null,
      error: 'Unsupported Career Role',
      message: 'This role is not recognized as a supported educational or industry career path in AICP. Please enter a relevant career role such as Software Developer, Data Analyst, AI/ML Engineer, Full Stack Developer, etc.',
      suggestedRoles: getFeaturedRoleSuggestions(),
    }
  }

  const cleaned = rawRole.trim().toLowerCase()
  if (cleaned.length < 2) {
    return {
      isValid: false,
      canonicalRole: null,
      roleData: null,
      error: 'Unsupported Career Role',
      message: `The role "${rawRole.trim()}" is not recognized as a supported educational or industry career path in AICP. Please enter a relevant career role such as Software Developer, Data Analyst, AI/ML Engineer, Full Stack Developer, etc.`,
      suggestedRoles: getFeaturedRoleSuggestions(),
    }
  }

  // 1. Direct canonical name match (case-insensitive)
  for (const [canonicalTitle, roleDef] of Object.entries(CAREER_ROLES)) {
    if (canonicalTitle.toLowerCase() === cleaned) {
      return {
        isValid: true,
        canonicalRole: canonicalTitle,
        roleData: roleDef,
      }
    }
  }

  // 2. Exact alias match
  for (const [canonicalTitle, roleDef] of Object.entries(CAREER_ROLES)) {
    if (roleDef.aliases.some((alias) => alias.toLowerCase() === cleaned)) {
      return {
        isValid: true,
        canonicalRole: canonicalTitle,
        roleData: roleDef,
      }
    }
  }

  // 3. Normalized fuzzy token/phrase match
  // E.g., "senior react developer" -> Frontend Developer, "python data analyst intern" -> Data Analyst
  for (const [canonicalTitle, roleDef] of Object.entries(CAREER_ROLES)) {
    for (const alias of roleDef.aliases) {
      const aliasTokens = alias.toLowerCase().split(/\s+/)
      // If all tokens of a multi-word alias appear in the cleaned query
      if (aliasTokens.length >= 2 && aliasTokens.every((token) => cleaned.includes(token))) {
        return {
          isValid: true,
          canonicalRole: canonicalTitle,
          roleData: roleDef,
        }
      }
    }
  }

  // 4. Single distinct domain keyword match (e.g. "devops", "cybersecurity", "frontend", "fullstack")
  const distinctKeywords = [
    { kw: 'fullstack', role: 'Full Stack Developer' },
    { kw: 'frontend', role: 'Frontend Developer' },
    { kw: 'backend', role: 'Backend Developer' },
    { kw: 'devops', role: 'DevOps Engineer' },
    { kw: 'cybersecurity', role: 'Cybersecurity Analyst' },
    { kw: 'infosec', role: 'Cybersecurity Analyst' },
    { kw: 'machine learning', role: 'Machine Learning Engineer' },
    { kw: 'data science', role: 'Data Scientist' },
    { kw: 'data analyst', role: 'Data Analyst' },
    { kw: 'data engineer', role: 'Data Engineer' },
    { kw: 'cloud', role: 'Cloud Engineer' },
    { kw: 'mobile developer', role: 'Mobile Developer' },
    { kw: 'ui/ux', role: 'UI/UX Designer' },
    { kw: 'software engineer', role: 'Software Developer' },
  ]

  for (const { kw, role } of distinctKeywords) {
    if (cleaned.includes(kw)) {
      return {
        isValid: true,
        canonicalRole: role,
        roleData: CAREER_ROLES[role],
      }
    }
  }

  // If none matched, the input is NOT a supported career role (e.g. thief, criminal, asdfgh, xyz123)
  return {
    isValid: false,
    canonicalRole: null,
    roleData: null,
    error: 'Unsupported Career Role',
    message: `The role "${rawRole.trim()}" is not recognized as a supported educational or industry career path in AICP. Please enter a relevant career role such as Software Developer, Data Analyst, AI/ML Engineer, Full Stack Developer, etc.`,
    suggestedRoles: getFeaturedRoleSuggestions(),
  }
}

/**
 * Returns a list of featured valid career roles for UI suggestions.
 */
export const getFeaturedRoleSuggestions = () => [
  'Software Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'Cloud Engineer',
  'DevOps Engineer',
  'Cybersecurity Analyst',
]
