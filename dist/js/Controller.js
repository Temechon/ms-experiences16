var Controller = (function () {
    function Controller(minion) {
        var _this = this;
        // The character skeleton (if any). Can be null
        this.skeleton = null;
        // The array of animations (if the model has no skeleton)
        this._animations = {};
        // The direction this character is heading to
        this._direction = new BABYLON.Vector3(0, 0, 0);
        // The destination this character is heading to
        this._destination = null;
        // The last distance computed between the minion position and its destination
        this._lastDistance = Number.POSITIVE_INFINITY;
        // A set of destination. The character will navigate through all these positions.
        this.destinations = [];
        // The character speed
        this.speed = 1;
        // All animations speeds will be multiplied by this factor
        this.animationSpeedMultiplier = 1;
        // True if the character is moving, false otherwise
        this.isMoving = false;
        this._minion = minion;
        this.findSkeleton();
        // Add move function to the character
        this._minion.getScene().registerBeforeRender(function () {
            _this._move();
        });
    }
    /**
     * Add a destination to this character.
     * data is a parameter that can be link to a destination. It will be called
     * when the minion arrives at this destination.
     */
    Controller.prototype.addDestination = function (value, data) {
        // Add this destination to the set of destination
        this.destinations.push({ position: value, data: data });
        // Return this to chain destination if needed
        return this;
    };
    /**
     * Move to the next character destination
     */
    Controller.prototype._moveToNextDestination = function () {
        // Get the next destination
        this._destination = this.destinations.shift();
        // reset distance check
        this._lastDistance = Number.POSITIVE_INFINITY;
        this.isMoving = true;
        // Compute direction
        this._direction = this._destination.position.subtract(this._minion.position);
        this._direction.normalize();
        // Rotate
        this.lookAt(this._destination.position);
    };
    /**
     * The character looks at the given position, but rotates only along Y-axis
     * */
    Controller.prototype.lookAt = function (value) {
        var dv = value.subtract(this._minion.position);
        var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
        this._minion.rotation.y = yaw;
    };
    /**
     * Attach the given mesh to this controller, and found the character skeleton.
     * The skeleton used for the mesh animation (and the debug viewer) is the first found one.
     */
    Controller.prototype.findSkeleton = function () {
        // Stop mesh animations
        this._minion.getScene().stopAnimation(this._minion);
        // Find skeleton if possible
        if (this._minion.skeleton) {
            this.skeleton = this._minion.skeleton;
            // Stop skeleton animations
            this._minion.getScene().stopAnimation(this.skeleton);
            // Activate animation blending    
            this.skeleton.enableBlending(0.08);
        }
    };
    /**
     * Run the animation between the character position and its first destination
     */
    Controller.prototype.start = function () {
        // If at least one destination
        if (this.destinations.length >= 1) {
            // Animate the character
            this.playAnimation('walk', true, 1);
            // Move to the next destination
            this._moveToNextDestination();
        }
    };
    /**
     * Removes all destination of the minion
     */
    Controller.prototype.stop = function () {
        this.destinations = [];
        this.pause();
    };
    /**
     * Pause the character movement
     */
    Controller.prototype.pause = function () {
        this.isMoving = false;
        // Animate the character in idle animation
        this.playAnimation('idle', true, 1);
    };
    /**
     * Resume the character movement
     */
    Controller.prototype.resume = function () {
        this.isMoving = true;
        // Animate the character
        this.playAnimation('walk', true, 1);
    };
    /**
     * Move the character to its destination.
     * The character y position is set according to the ground position (or 0 if no ground).
     * The attribute _canMove is reset to false when the destination is reached.
     */
    Controller.prototype._move = function () {
        // If a destination has been set and the character has not been stopped
        if (this.isMoving && this._destination) {
            // Compute distance to destination
            var distance = BABYLON.Vector3.Distance(this._minion.position, this._destination.position);
            // Change destination if th distance is increasing (should not)
            if (distance < Controller.Epsilon || distance > this._lastDistance) {
                // Set the minion position to the curent destination
                this._minion.position.copyFrom(this._destination.position);
                if (this.atEachDestination) {
                    this.atEachDestination(this._destination.data);
                }
                // Destination has been reached
                this.isMoving = false;
                if (this.destinations.length == 0) {
                    // Animate the character in idle animation
                    this.playAnimation('idle', true, 1);
                    // Call function when final destination is reached
                    if (this.atFinalDestination) {
                        this.atFinalDestination(this._destination.data);
                    }
                }
                else {
                    this._moveToNextDestination();
                }
            }
            else {
                this._lastDistance = distance;
                // Add direction to the position
                var delta = this._direction.scale(this._minion.getScene().getAnimationRatio() * this.speed);
                this._minion.position.addInPlace(delta);
            }
        }
    };
    /**
     * Add an animation to this character
     */
    Controller.prototype.addAnimation = function (name, from, to) {
        if (this.skeleton) {
            this.skeleton.createAnimationRange(name, from, to);
        }
        else {
            this._animations[name] = { from: from, to: to };
        }
    };
    /**
     * Play the given animation if skeleton found
     */
    Controller.prototype.playAnimation = function (name, loop, speed) {
        if (speed === void 0) { speed = 1; }
        if (this.skeleton) {
            this.skeleton.beginAnimation(name, loop, speed * this.animationSpeedMultiplier);
        }
        else {
            var animation = this._animations[name];
            this._minion.getScene().beginAnimation(this._minion, animation.from, animation.to, loop, speed * this.animationSpeedMultiplier);
        }
    };
    Controller.Epsilon = 0.1;
    return Controller;
}());
//# sourceMappingURL=Controller.js.map