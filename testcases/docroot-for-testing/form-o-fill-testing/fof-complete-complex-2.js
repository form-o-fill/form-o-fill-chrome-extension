{
  "workflows": [
    {
      "flags": {},
      "id": 1,
      "name": "remote URL workflow",
      "steps": [
        "Complex - 2 - remote URL"
      ]
    }
  ],
  "rules": {
    "tabSettings": [
      {
        "id": "1",
        "name": "remote import URL"
      }
    ],
    "rules": [
      {
        "code": "var rules = [{\n  name: \"Complex - 2 - remote URL\",\n  color: \"Orange\",\n  url: /22-complex-2\\.html/,\n  fields: [{\n    selector: \"#target11\",\n    value: \"remote import!\"\n  }]\n}\n];",
        "tabId": 1
      }
    ]
  }
}
