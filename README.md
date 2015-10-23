# JSON Schema Form Generator (WIP)

Generate a form/form-input-structure from a given JSON-Schema.

This created itself due to other projects not "doing" what was required: usable form generation via a JSON schema.

Form is generated according to the schema structure and oblivious to the data structure. 
If the given data structure matches then the data will be added as values.

**DIY**

* style yourself
* action yourself 
    * array needs a "add new item action" which duplicates the array schema as an item -- _possible change_
* data-bind yourself

## Usage

Is UMD/AMD/Global compatible via [gulp-umd](gulp-umd)

### UMD

    var generator = require("jsonschema-formgenerator");

### AMD/RequireJS

    require(["jsonschema-formgenerator"], function (generator) {});

### Global

    window.JsonschemaFormgenerator;
    
## Methods

### render
Will render schema as form elements from given path adding possible initial data to fields.

### renderChunk
Will render given schema definition as form elements from given path adding possible initial data to fields.
_This could be seen as a double but it actually works differently.._

## Options

Options need to be set before a render action.
_TODO_

## TODO
 * [ ] simple interface
 * [ ] add tests
 * [ ] release script
 * [ ] CI
 * [ ] Render-form method which includes form tag and using options (i.e. force array item; to force a minimal array item if none set)
 * [x] jquery plugin/function for appending a rendered schema to current element
    * [ ] append a rendered schema/form to current element
 * [ ] Possible options

### Possible future
 * [ ] remove jquery dependency
 * [ ] add buttons for action hinting (note action is not included)
 * [ ] add possibility to overload templates (currently hardcoded -- possible Handlebars though adds extra dependency)
     * i.e. bootstrap-correct html (though via css the output html can already be bootstrapped even if it is not the "correct" html).. also can also just be manipulated after render.
 
 
