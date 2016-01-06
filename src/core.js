/**
 * @see http://json-schema.org/latest/json-schema-validation.html#anchor104
 * @see https://developer.mozilla.org/en/docs/Web/HTML/Element/Input
 * @see https://developer.mozilla.org/en/docs/Web/HTML/Element/Textarea
 *
 * todo depends on jquery -- todo is to remove dependencies and build for multiple distribution types
 */

/**
 * export render
 *
 * @param {Object} schema
 * @param {Array} path
 * @param {Object} data
 *
 * @returns {*}
 */
function render(schema, path, data) {
  return renderObject(schema, path, data).then(function (html) {
    applyEventHandlers();
    return html;
  });
}

/**
 * Promise render of given chunks
 *
 * @param {Array} chunkPromises
 * @returns {*}
 */
function renderChunks(chunkPromises) {
  return $.when.apply($, chunkPromises).then(function () {
    return $.makeArray(arguments).join('');
  });
}

/**
 *
 * @export
 *
 * @param {Array} path
 * @param {Object} propConfig
 * @param {*} value
 */
function renderChunk(path, propConfig, value) {
  var propName = path.pop();
  var className = propName;
  if (!isNaN(parseInt(propName, 10))) {
    // singular class name from assumed multiple
    className = path[path.length - 1].slice(0, -1);
  }
  var id = (path.length ? path.join('-') + '-' : '') + propName;
  var chunk = ['<div class="schema-property schema-property-' + className +
  ' schema-datatype-' + propConfig.type + '" data-datatype="' + propConfig.type + '">'];
  var subPath = path.slice(0);
  var name = 'root' + (path.length ? '[' + path.join('][') + ']' : '') + '[' + propName + ']';
  subPath.push(propName);

  if ((value === undefined) && (propConfig['default'] !== undefined)) {
    value = propConfig['default'];
  }

  // custom renderer?
  if (propConfig.options && propConfig.options.renderer && hasRenderer(propConfig.options.renderer)) {
    chunk.push(applyRenderer(propConfig.options.renderer, propConfig, subPath, id, name, value));
    chunk.push('</div>');
    return renderChunks(chunk);
  }

  // @todo generic render type label/input (reduce duplication)

  switch (propConfig.type) {
    case undefined: //complex type
    case 'object':
      chunk.push(renderObject(propConfig, subPath, value));
      break;

    case 'number':
    case 'integer':

      // @todo generic render type label/input (reduce duplication)
      if (!(propConfig.options && propConfig.options.inputRenderer === 'hidden')) {
        chunk.push(renderInputLabel(id, propConfig.title ? propConfig.title : propName));
      }
      chunk.push(renderNumber(propConfig, subPath, id, name, value));
      break;

    case 'boolean':

      // @todo generic render type label/input (reduce duplication)
      chunk.push(propConfig.options && propConfig.options.inputRenderer === 'hidden' ?
        renderInputControl(propConfig, subPath, id, name, value) :
        renderBoolean(propConfig, subPath, id, name, value)
      );
      break;

    case 'array':

      chunk.push(renderArray(propConfig, subPath, id, name, value));

      break;

    case 'string':
      // @todo generic render type label/input (reduce duplication)

      propConfig.isEnum = (propConfig['enum'] !== undefined);
      propConfig.isHidden = propConfig.options && propConfig.options.inputRenderer === 'hidden';

      if (propConfig.isEnum && !propConfig.isHidden || !propConfig.isHidden) {
        chunk.push(renderInputLabel(id, propConfig.title ? propConfig.title : propName, (!propConfig.isEnum && propConfig.minLength)));
      }
      chunk.push(renderString(propConfig, subPath, id, name, value));
      break;

    default:
      throw new Error('Schema item "' + path.join('.') + '" is not valid');
  }

  chunk.push('</div>');
  return renderChunks(chunk);
}

/**
 * @TODO klevera
 *
 * @param {Object} schema
 * @param {Array} path
 * @param {Object} data
 *
 * @returns {*}
 */
function renderOneOf(schema, path, data) {
  var chunks = [];
  var subSchemaChunks = [];

  var propName = path.pop();
  var name = 'root' + (path.length ? '[' + path.join('][') + ']' : '') + '[' + propName + ']';
  var id = (path.length ? path.join('-') + '-' : '') + propName;

  var chunk = ['<div class="schema-property schema-property-oneOf-selector">'];

  chunks.push('<label for="' + id + '">' + schema.title + '</label>');
  chunks.push('<select id="' + id + '" name="' + name + '" class="schema-property-oneOf-selector">');
  $.each(schema.oneOf, function (idx, subSchema) {
    chunks.push('<option value="' + idx + '">' + subSchema.title + '</option>');
    delete subSchema.title;
    subSchema.disabled = true;
    console.log('oneOF adata', data);
    subSchemaChunks.push(renderObject(subSchema, path, data));
  });

  chunks.push('</select>');
  chunks.push('</div>');
  chunks.push('<div class="schema-property schema-property-' + propName + ' schema-property-oneOf" style="display:none">');
  chunks.push(renderChunks(subSchemaChunks));
  chunks.push('</div>');

  addEventHandler(function () {
    $(document).on('change', '.schema-property-oneOf-selector', function () {
      var $target = $(event.target);
      $target.closest('.schema-property').siblings('.schema-property-oneOf').show()
        .find('> fieldset').attr('disabled', 'disabled').hide().each(function (idx) {
        if (idx === parseInt($target.val(), 10)) {
          $(this).removeAttr('disabled').show();
        }
      });
    });
  });

  return renderChunks(chunks);
}

/**
 *
 * @param {Array} schemas
 * @param {Array} path
 * @param {Object} data
 *
 * @returns {*}
 */
function renderAllOf(schemas, path, data) {
  var chunks = [];
  $.each(schemas, function (key, subSchema) {
    chunks.push(renderChunk(path, subSchema, data));
  });
  return renderChunks(chunks);
}

/**
 *
 * @returns {*}
 */
function getRef() {
  return $.when({});
}

/**
 *
 * @param {Object} schema
 * @param {Array} path
 * @param {Object} data
 *
 * @returns {*}
 */
function renderObject(schema, path, data) {
  var chunkPromises = [];
  data = data || {};

  if (schema.properties === undefined) {

    if (schema.allOf || schema.extends) {
      chunkPromises.push('<fieldset>');
      chunkPromises.push(renderAllOf(schema.allOf ? schema.allOf : schema.extends, path, data));
      chunkPromises.push('</fieldset>');
      return renderChunks(chunkPromises);
    }

    if (schema.oneOf) {
      chunkPromises.push('<fieldset>');
      chunkPromises.push(renderOneOf(schema, path, data));
      chunkPromises.push('</fieldset>');
      return renderChunks(chunkPromises);
    }

    if (schema.$ref) {
      return this.getRef(schema.$ref).then(function (subSchema) {
        if (subSchema.properties) {
          return renderObject(subSchema, path, data);
        } else {
          return renderChunk(path, subSchema, data);
        }
      });
    }

    return renderChunks(chunkPromises);
  }

  chunkPromises.push('<fieldset' + (schema.disabled ? ' disabled="disabled"' : '') + '>');
  if (schema.title) {
    chunkPromises.push('<div class="legend">' + schema.title + '</div>');
  }
  $.each(schema.properties, function (propName, propConfig) {
    path.slice(0);
    path.push(propName);
    chunkPromises.push(renderChunk(path, propConfig, data[propName]));
  });
  chunkPromises.push('</fieldset>');

  return renderChunks(chunkPromises).then(function (html) {

    if (schema.required) {
      var $html = $('<p>').html(html);
      $.each(schema.required, function (idx, property) {
        $html.find(['input', 'textarea', 'select'].map(function (type) {
          return '.schema-property-' + property + ' > ' + type
        }).join(',')).attr('required', 'required');
      });
      return $html.html();
    }

    return html;
  });
}

function renderArray(propConfig, subPath, id, name, value) {
  var chunk = [];
  if (propConfig.items.enum) { // multiple select

    propConfig.items.title = propConfig.title;

    chunk.push(renderChunk(subPath, propConfig.items, value).then(function (html) {
      // @todo renderer (instead of dom manipulation)
      var $html = $(html);
      $html.find('select').prop('multiple', 'multiple').each(function () {
        var $el = $(this);
        $el.attr('name', $el.attr('name') + '[]').find('option').each(function () {
          var $el = $(this);
          if (value && value.indexOf($el.val()) !== -1) {
            $el.attr('selected', 'selected');
          }
        });
      });
      return $html.html();
    }));

  } else {

    chunk.push('<fieldset>');
    if (propConfig.title) {
      chunk.push('<div class="legend">' + propConfig.title + '</div>');
    }
    $.each(value || {}, function (key, subData) {
      var itemSubPath = subPath.slice(0);
      itemSubPath.push(key);
      chunk.push(renderChunk(itemSubPath, propConfig.items, subData));
    });
    chunk.push('</fieldset>');
  }
  return renderChunks(chunk);
}

/**
 *
 * @param propConfig
 * @param path
 * @param id
 * @param name
 * @param value
 *
 * @returns {string}
 */
function renderBoolean(propConfig, path, id, name, value) {
  // @todo generic func
  // NOTE: inputs before labels
  return '<input type="checkbox" name="' + name + '" id="' + id + '" value="1"' +
    (value ? ' checked="checked"' : '' ) + ' />' +
    '<label for="' + id + '">' + propConfig.title + '</label>';
}

/**
 *
 * @param propConfig
 * @param path
 * @param id
 * @param name
 * @param value
 *
 * @returns {string}
 */
function renderNumber(propConfig, path, id, name, value) {
  if (typeof propConfig['enum'] !== "undefined") {
    return renderEnum(propConfig, path, id, name, value);
  }
  propConfig.format = 'number';
  return renderInputControl(propConfig, path, id, name, value);
}

/**
 *
 * @param propConfig
 * @param path
 * @param id
 * @param name
 * @param value
 *
 * @returns {string}
 */
function renderString(propConfig, path, id, name, value) {
  if (propConfig.isEnum && !propConfig.isHidden) {
    return renderEnum(propConfig, path, id, name, value);
  }
  return renderInputControl(propConfig, path, id, name, value);
}

/**
 *
 * @param propConfig
 * @param path
 * @param id
 * @param name
 * @param value
 *
 * @returns {string}
 */
function renderEnum(propConfig, path, id, name, value) {
  var chunk = [];
  //var id = path.join('-');
  //var name = 'root[' + path.join('][') + ']';

  if ((value === undefined) && (propConfig['default'] !== undefined)) {
    value = propConfig['default'];
  }

  var enumTitles = ((propConfig.options && propConfig.options.enum_titles) ?
    propConfig.options.enum_titles : {});

  // custom input renderer
  var inputRenderer = (propConfig.options && propConfig.options.inputRenderer) ?
    propConfig.options.inputRenderer : null;
  if (hasInputRenderer(inputRenderer)) {
    return applyInputRenderer(inputRenderer, propConfig, path, id, name, value)
  }

  // default input renderer
  var multiple = propConfig.options && propConfig.options.multiple === true;
  var readOnly = propConfig.options && propConfig.options.readOnly === true;
  var classes = propConfig.options && propConfig.options.inputClasses ? propConfig.options.inputClasses.join(' ') : false;
  var rules = propConfig.options && propConfig.options.rules ? propConfig.options.rules : false;

  switch (propConfig.inputType) {
    case 'radio':
      chunk.push('<div class="radiogroup">');
      $.each(propConfig['enum'], function (key, radioValue) {
        var radioId = id + '-' + radioValue;
        chunk.push('<div>');
        chunk.push('<input type="radio" name="' + name + '" value="' + radioValue +
          '" id="' + radioId + '"' + ((radioValue === value) ? ' checked="checked"' : '' ) +
          '><label for="' + radioId + '' + '">' + (enumTitles[key] || radioValue) +
          '</label>');
        chunk.push('</div>');
      });
      chunk.push('</div>');
      break;

    default:
      chunk.push('<select name="' + name + '" id="' + id + '"' +
        (classes ? ' class="' + classes + '"' : '') +
        (readOnly ? ' readonly="readonly"' : '') +
        (multiple ? ' multiple="multiple"' : '') +
        (rules ? " data-rules='" + JSON.stringify(rules) + "'" : '') +
        '>');
      $.each(propConfig['enum'], function (key, optionValue) {
        chunk.push('<option value="' + optionValue + '"' +
          ((optionValue === value) ? ' selected="selected"' : '' ) +
          '>' + (enumTitles[key] || optionValue) + '</option>');
      });
      chunk.push('</select>');
  }

  return chunk.join('');
}

/**
 *
 * @param id
 * @param text
 * @param required
 *
 * @returns {string}
 */
function renderInputLabel(id, text, required) {
  return '<label for="' + id + '">' + text + (required ? ' *' : '') + '</label>';
}

/**
 * @see http://json-schema.org/latest/json-schema-validation.html#anchor104
 * @see https://developer.mozilla.org/en/docs/Web/HTML/Element/Input
 * @see https://developer.mozilla.org/en/docs/Web/HTML/Element/Textarea
 *
 * @param propConfig
 * @param path
 * @param id
 * @param name
 * @param value
 *
 * @returns {string}
 */
function renderInputControl(propConfig, path, id, name, value) {

  // determine input type
  var type = propConfig.format || 'text';
  if (propConfig.options && propConfig.options.inputRenderer) {
    type = propConfig.options.inputRenderer;
  }

  // custom input renderer

  if (hasInputRenderer(type)) {
    return applyInputRenderer(type, propConfig, path, id, name, value)
  }

  // default input renderer

  var description = propConfig.description;

  var readOnly = propConfig.options && propConfig.options.readOnly == true;
  var classes = propConfig.options && propConfig.options.inputClasses ? propConfig.options.inputClasses.join(' ') : false;
  var rules = propConfig.options && propConfig.options.rules ? propConfig.options.rules : false;

  if (type === 'textarea') {
    return '<textarea type="text"' +
      (classes ? ' class="' + classes + '"' : '') +
      (id ? ' id="' + id + '"' : '') +
      (name ? ' name="' + name + '"' : '') +
      (propConfig.minLength ? ' minlength="' + propConfig.minLength + '"' : '') +
      (propConfig.maxLength ? ' maxlength="' + propConfig.maxLength + '"' : '') +
      (description ? ' placeholder="' + description + '"' : '') +
      (readOnly ? ' readonly="true"' : '') +
      (rules ? " data-rules='" + JSON.stringify(rules) + "'" : '') +
      '>' +
      (value || '') + '</textarea>';
  }
  return '<input ' +
    (type ? ' type="' + type + '"' : '') +
    (classes ? ' class="' + classes + '"' : '') +
    (id ? ' id="' + id + '"' : '') +
    (name ? ' name="' + name + '"' : '') +
    (propConfig.pattern ? ' pattern="' + propConfig.pattern + '"' : '') +
    (propConfig.minLength ? ' minlength="' + propConfig.minLength + '"' : '') +
    (propConfig.maxLength ? ' maxlength="' + propConfig.maxLength + '"' : '') +
    (propConfig.min ? ' min="' + propConfig.min + '"' : '') +
    (propConfig.max ? ' max="' + propConfig.max + '"' : '') +
    (value ? ' value="' + value + '"' : '') +
    (propConfig.title ? ' title="' + propConfig.title + '"' : '') +
    (description ? ' placeholder="' + description + '"' : '') +
    (readOnly ? ' readonly="true"' : '') +
    (rules ? " data-rules='" + JSON.stringify(rules) + "'" : '') +
    '/>';
}
