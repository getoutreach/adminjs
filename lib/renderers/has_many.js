import BaseRenderer from 'adminjs/renderers/base';

var HasManyRenderer = BaseRenderer.extend({
  tagName: 'ul',
  classNames: ['has-many-renderer'],
  templateName: 'renderers/has_many'
});

export default HasManyRenderer;