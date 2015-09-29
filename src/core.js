// depends on jquery -- todo is to remove dependencies and build for multiple distribution types

function renderChunks(chunkPromises) {
	return $.when.apply($, chunkPromises).then(function () {
		return $.makeArray(arguments).join('');
	});
}

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
	var valueAsString = value || '';

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
			//check for "explicit empty"
			if (propConfig.title && propConfig.title !== '') {
				chunk.push('<label for="' + id + '">' + (propConfig.title ? propConfig.title : propName)  +
						'</label>');
			}

			chunk.push((propConfig.format === 'immutable' ?
				renderImmutable : renderNumber)(propConfig, subPath, value, id));

			break;

		case 'boolean':
			// inputs before labels
			chunk.push('<input type="checkbox" name="' + name + '" id="' + id + '" value="1"' +
					(value ? ' checked="checked"' : '' ) + ' />');
			chunk.push('<label for="' + id + '">' + propConfig.title + '</label>');
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
			var isEnum = (propConfig['enum'] !== undefined);
			if (propConfig.title) {
				chunk.push('<label for="' + id + '">' + propConfig.title +
						((!isEnum && propConfig.minLength) ? ' *' : '') + '</label>');
			}

			if (isEnum) {
				chunk.push(renderEnum(propConfig, subPath, value));
			} else {
				chunk.push((propConfig.format === 'immutable' ?
						renderImmutable : renderString)(propConfig, subPath, value, id));
			}
			break;

		default:
			chunk.push('<label for="' + id + '">' + propConfig.title + '</label>');
			chunk.push('<input type="' + (propConfig.inputType || propConfig.format || 'text') +
					'" name="' + name + '" id="' + id +
					(propConfig.description ? '" placeholder="' + propConfig.description : '' ) +
					'" value="' + valueAsString + '">');
	}

	chunk.push('</div>');
	return renderChunks(chunk);
}

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

function renderString(propConfig, path, value, id) {
	var valueAsString = value || '';
	return (propConfig.inputType === 'textarea') ?
		'<textarea type="text" name="' + name +
			(propConfig.description ? '" placeholder="' + propConfig.description : '' ) +
			'" id="' + id + '">' + valueAsString + '</textarea>' :
		'<input type="' + (propConfig.inputType || propConfig.format || 'text') +
			'" name="' + name +
			(propConfig.description ? '" placeholder="' + propConfig.description : '' ) +
			'" id="' + id + '" value="' + valueAsString + '">';
}

function renderNumber(propConfig, path, value, id) {
	return (propConfig['enum'] === undefined) ?
		'<input type="' + (propConfig.inputType || 'number') + '" name="' + name + '" id="' + id +
			(propConfig.description ? '" placeholder="' + propConfig.description : '' ) +
			(propConfig.min ? '" min="' + propConfig.min : '' ) +
			(propConfig.max ? '" max="' + propConfig.max : '' ) +
			'" value="' + (value || '') + '">'
		: renderEnum(propConfig, path, value)
}

function renderImmutable(propConfig, path, value, id) {
	if ((value === undefined) && (propConfig['default'] !== undefined)) {
		value = propConfig['default'];
	}
	return '<div class="immutable">'  + value + '</div>';
}

function renderEnum(propConfig, path, value) {
	var chunk = [];
	var id = path.join('-');
	var name = 'root[' + path.join('][') + ']';

	if ((value === undefined) && (propConfig['default'] !== undefined)) {
		value = propConfig['default'];
	}

	var enumTitles = ((propConfig.options && propConfig.options.enum_titles) ?
			propConfig.options.enum_titles : {});

	if (propConfig.format === 'immutable') {
		return renderImmutable(propConfig, path, enumTitles[value], id);
	}
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
			chunk.push('<select name="' + name + '" id="' + id + '" class="">');
			$.each(propConfig['enum'], function (key, optionValue) {
				chunk.push('<option value="' + optionValue +'"' +
						((optionValue === value) ? ' selected="selected"' : '' ) +
						'>' + (enumTitles[key] || optionValue) + '</option>');
			});
			chunk.push('</select>');
	}

	return chunk.join('');
}