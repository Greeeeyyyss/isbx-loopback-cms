angular.module('dashboard.services.Image', [])

.service('ImageService', function($q) {
	var self = this;

  /**
   * Resizes the image and fixes orientation if uploading from mobile device
   * @param dataURI - Image URL or Data URI
   * @param options
   *  - width
   *  - height
   *  - aspect: stretch, fill, fit
   * @param callback
   */
  this.resize = function(dataURI, options, callback) {
    self.loadImageURI(dataURI, function(error, image) {
      if (error) return callback(error);
      EXIF.getData(image, function(exif) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var orientation = EXIF.getTag(this, "Orientation");
        //console.log('EXIF', EXIF.pretty(this))
        if (!options) options = {};
        var width = options.width ? options.width : image.width;
        var height = options.height ? options.height : image.height;
        var aspect = options.aspect ? options.aspect : 'fit';
        switch(aspect) {
          case "stretch":
            canvas.width = width;
            canvas.height = height;
            break;
          case "fill":
            canvas.width = width;
            canvas.height = height;
            var scale = Math.max(width / image.width, height / image.height);
            width = image.width * scale;
            height = image.height * scale;
            break;
          case "fit":
          default:
            var scale = Math.min(width / image.width, height / image.height);
            if (scale > 1.0) scale = 1.0; //don't enlarge the image
            width = image.width * scale;
            height = image.height * scale;
            canvas.width = width;
            canvas.height = height;
            break;
        }
        var sizeChanged = (canvas.height != image.height) || (canvas.width != image.width);

        context.save();
        var orientationChanged = self.setOrientation(canvas, context, width, height, orientation);
        if (orientationChanged || sizeChanged) {
          context.drawImage(image, 0, 0, width, height);
          context.restore();

          try {
            var dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            callback(null, dataUrl);
          } catch(e) {
            callback(null, dataURI);
          }
        } else {
          callback(null, dataURI);
        }
      });
    });
  };

  this.fixOrientationWithDataURI = function(dataURI, callback) {
    self.resize(dataURI, {}, callback);
  };

  this.setOrientation = function(canvas, context, width, height, orientation) {
    var orientationChanged = false;
    //EXIF orientation
    switch (orientation) {
      case 2:
        // horizontal flip
        context.translate(width, 0);
        context.scale(-1, 1);
        orientationChanged = true;
        break;
      case 3:
        // 180° rotate left
        context.translate(width, height);
        context.rotate(Math.PI);
        orientationChanged = true;
        break;
      case 4:
        // vertical flip
        context.translate(0, height);
        context.scale(1, -1);
        orientationChanged = true;
        break;
      case 5:
        // vertical flip + 90 rotate right
        canvas.width = height;
        canvas.height = width;
        context.rotate(0.5 * Math.PI);
        context.scale(1, -1);
        orientationChanged = true;
        break;
      case 6:
        // 90° rotate right
        canvas.width = height;
        canvas.height = width;
        context.rotate(0.5 * Math.PI);
        context.translate(0, -height);
        orientationChanged = true;
        break;
      case 7:
        // horizontal flip + 90 rotate right
        canvas.width = height;
        canvas.height = width;
        context.rotate(0.5 * Math.PI);
        context.translate(width, -height);
        context.scale(-1, 1);
        orientationChanged = true;
        break;
      case 8:
        // 90° rotate left
        canvas.width = height;
        canvas.height = width;
        context.rotate(-0.5 * Math.PI);
        context.translate(-width, 0);
        orientationChanged = true;
        break;
    }
    return orientationChanged;
  };

  this.loadImageURI = function(imageUrl, callback) {
    var image = new Image();
    image.onload = function() {
      callback(null, image);
    };
    image.onerror = function(error) {
      callback(error);
    };

    image.src = imageUrl;
  };

})

;