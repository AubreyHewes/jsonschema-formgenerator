# WIP

# JSON Schema Form Renderer

Render a form/form-input-structure from a given JSON-Schema.

This created itself due to other projects not "doing" what was required: usable form generation via a JSON schema.

Form is generated according to the schema structure and oblivious to the data structure. 
If the data structure matches then the data will be added as values.

**DIY**

* style yourself
* data bind yourself
* action yourself (i.e. array needs a "add new item action" which duplicates the array schema as an item) -- possible change

## Methods

### render
Will render schema as form elements from given path adding possible initial data to fields.

#### Modular

    var html = require("jsonschema-formrenderer").render(schema, path, data);
    
#### Global

    var html = JSONSchemaFormRenderer.render(schema, path, data);

### renderChunk
Will render given schema definition as form elements from given path adding possible initial data to fields.
_This could be seen as a double but it actually works differently.._

#### Modular

    var html = require("jsonschema-formrenderer").renderChunk(path, propertyCfg, data);
    
#### Global

    var html = JSONSchemaFormRenderer.renderChunk(path, propertyCfg, data);

## Options

Options need to be set before a render action.

## TODO
 * [ ] simple interface
 * [ ] add tests
 * [ ] release script
 * [ ] CI
 * [ ] Render-form method which includes form tag and using options (i.e. force array item; to force a minimal array item if none set)
 * [x] jquery plugin/function for appending a rendered schema to current element
    * [ ] append a rendered schema/form to current element

### Possible future
 * [ ] remove jquery dependency
 * [ ] add buttons for action hinting (note action is not included)
 * [ ] add possibility to overload templates (currently hardcoded -- possible Handlebars though adds extra dependency)
     * i.e. bootstrap-correct html (though via css the output html can already be bootstrapped even if it is not the "correct" html).. also can alsojust be manipulated after render.
 
 
