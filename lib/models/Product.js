const mongoose = require('mongoose'),
      uniqueValidator = require('mongoose-unique-validator'),
      noImg = 'https://www.finsscuba.com/img/no-product.png';

var ProductSchema = new mongoose.Schema({
  name: { type: String, required: [true, "can't be blank"], index: true },
  sku: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], index: true },
  brand: { type: String, required: [true, "can't be blank"] },
  availability: String,
  description: String,
  imageSrc: String,
  price: String,
  url: { type: String, required: [true, "can't be blank"], index: true }

}, { timestamps: true });

ProductSchema.plugin(uniqueValidator, { message: 'is already taken.' });

ProductSchema.methods.toProductJSONFor = function (product) {
  return {
    name: this.name,
    sku: this.sku,
    brand: this.brand,
    description: this.description,
    price: this.price,
    imageSrc: this.imageSrc || noImg,
    url: this.url
  };
};

ProductSchema.statics.createOrUpdate = function (product, cb) {
  this.find({ 'sku': product.sku }, 'name', (err, rs) => {
    if (err) return cb(err);
    if (rs.length > 0) {
      this.findOneAndUpdate({ 'sku': product.sku }, product, err => {
        if (err) return cb(err);
      });
    } else {
      product.price = product.price == "" ? "0" : product.price;
      this.create(product, err => {
        if (err) return cb(err);
      });
    }
  });
};

mongoose.model('Product', ProductSchema);