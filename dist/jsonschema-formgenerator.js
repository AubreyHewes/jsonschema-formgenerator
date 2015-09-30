(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        window.JSONSchemaFormRenderer = factory(jQuery);
    }
}(function ($) {


// depends on jquery -- todo is to remove dependencies and build for multiple distribution types

/**
 * Promise render of given chunks
 *
 * @param chunkPromises
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
 * @param path
 * @param propConfig
 * @param value
 */
function renderChunk(path, propConfig, value) {
	var propName = path.pop();
	var className = propName;
	if (!isNaN(parseInt(propName, 10))) {
		// singular class name from assumed multiple
		className = path[path.length-1].slice(0, -1);
	}
	var id = (path.length ? path.join('-') + '-' : '') + propName;
	var chunk = ['<div class="schema-property schema-property-' + className +
		' schema-datatype-' + propConfig.type + '" data-datatype="' + propConfig.type + '">'];
	var subPath = path.slice(0);
	var name = 'root' + (path.length ? '[' + path.join('][')+ ']' : '') + '[' + propName + ']';
	subPath.push(propName);

	if ((value === undefined) && (propConfig['default'] !== undefined)) {
		value = propConfig['default'];
	}

	// custom renderer?
	if (propConfig.options && propConfig.options.renderer && hasRenderer(propConfig.options.renderer)) {
		chunk.push(applyRenderer(propConfig, subPath, value, id));
		chunk.push('</div>');
		return renderChunks(chunk);
	}


	// @todo generic render type label/input (reduce duplication)

	switch (propConfig.type) {
		case undefined: //complex type
		case 'object':
			chunk.push('<div class="fieldset">');
			if (propConfig.title) {
				chunk.push('<div class="legend">' + propConfig.title + '</div>');
			}

			chunk.push(renderObject(propConfig, subPath, value));
			chunk.push('</div>');
			break;

		case 'number':
		case 'integer':

			// @todo generic render type label/input (reduce duplication)
			if (!(propConfig.options && propConfig.options.inputRenderer === "hidden")) {
				chunk.push(renderInputLabel(id, propConfig.title ? propConfig.title : propName));
			}
			chunk.push(renderNumber(propConfig, subPath, value, id));
			break;

		case 'boolean':

			// @todo generic render type label/input (reduce duplication)
			chunk.push(renderBoolean(propConfig, subPath, value, id));
			//if (!(propConfig.options && propConfig.options.inputRenderer === "hidden")) {
			//	chunk.push(renderInputLabel(id, propConfig.title ? propConfig.title : propName));
			//}
			break;

		case 'array':

			if (propConfig.items.enum) { // multiple select

				propConfig.items.title = propConfig.title;

				chunk.push(renderChunk(subPath, propConfig.items, value).then(function (html) {
					var $html = $(html);
					$html.find('select').prop('multiple', 'multiple');
					return $html.html();
				}));

			} else {

				chunk.push('<div class="fieldset">');
				if (propConfig.title) {
					chunk.push('<div class="legend">' + propConfig.title + '</div>');
				}
				$.each(value || {}, function (key, subData) {
					var itemSubPath = subPath.slice(0);
					itemSubPath.push(key);
					chunk.push(renderChunk(itemSubPath, propConfig.items, subData));
				});
				chunk.push('</div>');
			}
			break;

		case 'string':
			// @todo generic render type label/input (reduce duplication)

			var isEnum = (propConfig['enum'] !== undefined);
			if (isEnum || !(propConfig.options && propConfig.options.inputRenderer === "hidden")) {
				chunk.push(renderInputLabel(id, propConfig.title ? propConfig.title : propName, (!isEnum && propConfig.minLength)));
			}
			chunk.push(renderString(propConfig, subPath, value, id));
			break;

		default:
			throw new Error('Schema item "' + path.join('.') + '" is not valid');
	}

	chunk.push('</div>');
	return renderChunks(chunk);
}

/**
 *
 * @export render
 *
 * @param schema
 * @param path
 * @param data
 * @returns {*}
 */
function renderObject (schema, path, data) {
	var chunkPromises = [];
	data = data || {};

	if (schema.properties === undefined) {
		if (schema.allOf) {
			$.each(schema.allOf, function (key, subSchema) {
				chunkPromises.push(renderObject(subSchema, path, data));
			});
			return renderChunks(chunkPromises);
		}

		if (schema.oneOf) {
			$.each(schema.oneOf, function (key, subSchema) {
				chunkPromises.push(renderObject(subSchema, path, data));
			});
			return renderChunks(chunkPromises);
		}

		//if (schema.$ref) {
		//	return utils.getCachedXhrPromise('get', schema.$ref).then(function (subSchema) {
		//		if (subSchema.properties) {
		//			return renderObject(subSchema, path, data);
		//		} else {
		//			return renderChunk(path, subSchema, data);
		//		}
		//	});
		//}

		return renderChunks(chunkPromises);
	}

	$.each(schema.properties, function (propName, propConfig) {
		path.slice(0);
		path.push(propName);
		chunkPromises.push(renderChunk(path, propConfig, data[propName]));
	});

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

/**
 *
 * @param propConfig
 * @param path
 * @param value
 * @param id
 *
 * @returns {string}
 */
function renderBoolean (propConfig, path, value, id) {
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
 * @param value
 * @param id
 *
 * @returns {string}
 */
function renderNumber(propConfig, path, value, id) {
	if (typeof propConfig['enum'] !== "undefined") {
		return renderEnum(propConfig, path, value, id);
	}
	return renderInputControl(propConfig, path, value, id);
}

/**
 *
 * @param propConfig
 * @param path
 * @param value
 * @param id
 *
 * @returns {string}
 */
function renderString(propConfig, path, value, id) {
	if (typeof propConfig['enum'] !== "undefined") {
		return renderEnum(propConfig, path, value, id);
	}
	return renderInputControl(propConfig, path, value, id);
}

/**
 *
 * @param propConfig
 * @param path
 * @param value
 *
 * @returns {string}
 */
function renderEnum(propConfig, path, value) {
	var chunk = [];
	var id = path.join('-');
	var name = 'root[' + path.join('][') + ']';

	if ((value === undefined) && (propConfig['default'] !== undefined)) {
		value = propConfig['default'];
	}

	var enumTitles = ((propConfig.options && propConfig.options.enum_titles) ?
			propConfig.options.enum_titles : {});

	// custom input renderer
	var inputRenderer = (propConfig.options && propConfig.options.inputRenderer) ?
			propConfig.options.inputRenderer : null;
	if (hasInputRenderer(inputRenderer)) {
		return applyInputRenderer(inputRenderer, propConfig, path, enumTitles[value], id)
	}

	// default input renderer
	var multiple = propConfig.options && propConfig.options.multiple === true;
	var readOnly = propConfig.options && propConfig.options.readOnly === true;
	switch(propConfig.inputType) {
		case 'radio':
			chunk.push('<div class="radiogroup">');
			$.each(propConfig['enum'], function (key, radioValue) {
				var radioId = id + '-' + radioValue;
				chunk.push('<div>');
				chunk.push('<input type="radio" name="' + name + '" value="' + radioValue +
						'" id="' + radioId + '"' + ((radioValue === value) ? ' checked="checked"' : '' ) +
						'><label for="' + radioId + ''+ '">' + (enumTitles[key] || radioValue) +
						'</label>');
				chunk.push('</div>');
			});
			chunk.push('</div>');
			break;

		default:
			chunk.push('<select name="' + name + '" id="' + id + '"' +
				(readOnly ? ' readonly="readonly"' : '') +
				(multiple ? ' multiple="multiple"' : '') +
				'>');
			$.each(propConfig['enum'], function (key, optionValue) {
				chunk.push('<option value="' + optionValue +'"' +
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
function renderInputLabel (id, text, required) {
	return '<label for="' + id + '">' + text + (required ? ' *' : '') + '</label>';
}

/**
 *
 * @param propConfig
 * @param path
 * @param id
 * @param value
 *
 * @returns {string}
 */
function renderInputControl (propConfig, path, value, id) {

	// determine input type
	var type = propConfig.format || 'text';
	if (propConfig.options && propConfig.options.inputRenderer) {
		type = propConfig.options.inputRenderer;
	}

	// custom input renderer

	if (hasInputRenderer(type)) {
		return applyInputRenderer(type, propConfig, path, value, id)
	}

	// default input renderer

	var name = propConfig.name;

	var description = propConfig.description;

	var readOnly = propConfig.options && propConfig.options.readOnly == true;

	if (type === 'textarea') {
		return '<textarea type="text"' +
			(id ? ' id="' + id + '"' : '') +
			(name ? ' name="' + name + '"' : '') +
			(description ? ' placeholder="' + description + '"' : '') +
			(readOnly ? ' readonly="true"' : '') +
			'>' +
			(value || '') + '</textarea>';
	}
	return '<input ' +
			(type ? ' type="' + type + '"' : '') +
			(id ? ' id="' + id + '"' : '') +
			(name ? ' name="' + name + '"' : '') +
			(value ? ' value="' + value + '"' : '') +
			(description ? ' placeholder="' + description + '"' : '') +
			(readOnly ? ' readonly="true"' : '') +
			'/>';
}

//var options = {};
//function renderForm(schema, data, options) {
//	this.options = options;
//	return renderObject(schema, [], data);
//}


var renderers = {};

/**
 *
 * @export
 *
 * @param id
 *
 * @param callback (propConfig, path, value, id)
 *
 */
function addRenderer(id, callback) {
	renderers[id] = callback;
}

/**
 *
 * @param id
 *
 * @returns {boolean}
 */
function hasRenderer(id) {
	return typeof renderers[id] !== "undefined";
}

/**
 *
 * @returns string
 */
function applyRenderer() {
	var type = [].shift.call(arguments);
	return renderers[type].apply(arguments);
}


var inputRenderers = {};

/**
 *
 * @export
 *
 * @param id
 *
 * @param callback (propConfig, path, value, id)
 *
 */
function addInputRenderer(id, callback) {
	inputRenderers[id] = callback;
}

/**
 *
 * @param id
 *
 * @returns {boolean}
 */
function hasInputRenderer(id) {
	return typeof inputRenderers[id] !== "undefined";
}

/**
 *
 * @returns string
 */
function applyInputRenderer() {
	var type = [].shift.call(arguments);
	if (!inputRenderers[type]) {
		return '';
	}
	return inputRenderers[type].apply(arguments);
}

/**
 * Append schema defined fields to the current context; optionally filling data.
 *
 * @param schema
 * @param data
 */
$.fn.appendSchema = function (schema, data) {
	renderObject(schema, [], data).then(function (html) {
		$(this).append(html);
	});
};


	return {
		render: renderObject,
		renderChunk: renderChunk,
		addRenderer: addRenderer,
		addInputRenderer: addInputRenderer
	};

}));