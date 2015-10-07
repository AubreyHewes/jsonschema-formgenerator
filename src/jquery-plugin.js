/**
 * Append schema defined fields to the current context; optionally filling data.
 *
 * @param schema
 * @param data
 *
 * @return Promise
 */
$.fn.appendSchema = function (schema, data) {
	var $el = $(this);
	return renderObject(schema, [], data || {}).then(function (html) {
		return $el.append(html);
	});
};
