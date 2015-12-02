{
  "workflows": [],
  "rules": {
    "tabSettings": [
      {
        "id": "1",
        "name": "Library usage"
      },
      {
        "id": "3",
        "name": "Before Func"
      },
      {
        "id": "5",
        "name": "Basics"
      }
    ],
    "rules": [
      {
        "code": "var rules = [{\n  url: /.*test.*/,\n  name: \"Using the ENV in a before function\",\n  before: function(resolve, env) {\n    resolve(\"Hello ENV: \" + JSON.stringify(env));\n  },\n  fields: [{\n    selector: \"input\",\n    value: function(e, $data) {\n      return $data;\n    }\n  }]\n}, {\n  url: /.*test.*/,\n  name: \"Error thrown in before function\",\n  before: function(resolve, env) {\n    throw new Error(\"error !\");\n    resolve(\"never reached!\");\n  },\n  fields: [{\n    selector: \"input\",\n    value: \"throw error\"\n  }]\n}, {\n  url: /.*test.*/,\n  name: \"undefined in before function\",\n  before: function(resolve, env) {\n    var a = env.notExisting.goAway;\n    resolve(env.notExisting);\n  },\n  fields: [{\n    selector: \"input\",\n    value: \"undefined in before function\"\n  }]\n}\n];",
        "tabId": 1
      },
      {
        "code": "var rules = [{\n  url: /.*test.*/,\n  name: \"Using the ENV in a before function\",\n  before: function(resolve, env) {\n    resolve(\"Hello ENV: \" + JSON.stringify(env));\n  },\n  fields: [{\n    selector: \"input\",\n    value: function(e, $data) {\n      return $data;\n    }\n  }]\n}, {\n  url: /.*test.*/,\n  name: \"Error thrown in before function\",\n  before: function(resolve, env) {\n    throw new Error(\"error !\");\n    resolve(\"never reached!\");\n  },\n  fields: [{\n    selector: \"input\",\n    value: \"throw error\"\n  }]\n}, {\n  url: /.*test.*/,\n  name: \"undefined in before function\",\n  before: function(resolve, env) {\n    var a = env.notExisting.goAway;\n    resolve(env.notExisting);\n  },\n  fields: [{\n    selector: \"input\",\n    value: \"undefined in before function\"\n  }]\n}\n];",
        "tabId": 3
      },
      {
        "code": "var rules = [{\n  content: /TESTING SERVER RUNNING/,\n  name: \"Matching by content\",\n  fields: [{\n    selector: \"input\",\n    value: \"found by content\"\n  }]\n}, {\n  url: /.*test.*/,\n  name: \"Matching by URL\",\n  fields: [{\n    selector: \"input\",\n    value: \"found by URL\"\n  }]\n}, {\n  url: /.*test.*/,\n  name: \"Requesting external JSON\",\n  before: function(resolve) {\n    jQuery.getJSON(\"http://localhost:9292/form-o-fill-testing/json.json\").done(resolve);\n  },\n  fields: [{\n    selector: \"input\",\n    value: function($e, data) {\n      return data.data;\n    }\n  }]\n}\n];",
        "tabId": 5
      }
    ]
  }
}