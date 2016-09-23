interface IAnimation {
     [name: string]: {from:number, to:number};
}

class Controller {
    
    static Epsilon : number = 0.1;
    
    // The minion attached this controller
    private _minion : BABYLON.AbstractMesh; 
    
    // The character skeleton (if any). Can be null
    public skeleton : BABYLON.Skeleton = null;
    
    // The array of animations (if the model has no skeleton)
    public _animations : IAnimation = {};
        
    // The direction this character is heading to
    private _direction : BABYLON.Vector3 = new BABYLON.Vector3(0,0,0);

    // The destination this character is heading to
    private _destination : {position:BABYLON.Vector3, data:any} = null;

    // The last distance computed between the minion position and its destination
    private _lastDistance : number = Number.POSITIVE_INFINITY; 

    // A set of destination. The character will navigate through all these positions.
    public destinations : Array<{position:BABYLON.Vector3, data:any}> = [];

    // Function called at each destination if defined
    public atEachDestination : (data:any) => void;
    
    // Function called (if defined) when the final destination is reached
    public atFinalDestination : (data:any) => void;

    // The character speed
    public speed : number = 1;

    // All animations speeds will be multiplied by this factor
    public animationSpeedMultiplier : number = 1;

    // True if the character is moving, false otherwise
    public isMoving : boolean = false;
    
    
    constructor(minion : BABYLON.AbstractMesh) {
        this._minion = minion;

        this.findSkeleton();
    
        // Add move function to the character
        this._minion.getScene().registerBeforeRender(() => {
            this._move();
        });
    }

    /**
     * Add a destination to this character.
     * data is a parameter that can be link to a destination. It will be called 
     * when the minion arrives at this destination.
     */
    public addDestination(value:BABYLON.Vector3, data?: any) {
        // Add this destination to the set of destination
        this.destinations.push({position:value, data:data});

        // Return this to chain destination if needed
        return this;
    }

    /**
     * Move to the next character destination
     */
    private _moveToNextDestination() {
        // Get the next destination
        this._destination = this.destinations.shift();

        // reset distance check
        this._lastDistance= Number.POSITIVE_INFINITY; 
        this.isMoving = true;

        // Compute direction
        this._direction = this._destination.position.subtract(this._minion.position);
        this._direction.normalize();        
        
        // Rotate
        this.lookAt(this._destination.position);
    }    
    
    /**
     * The character looks at the given position, but rotates only along Y-axis 
     * */
    private lookAt(value:BABYLON.Vector3){
        var dv = value.subtract(this._minion.position);
        var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
        this._minion.rotation.y = yaw ;
    }

    /** 
     * Attach the given mesh to this controller, and found the character skeleton.
     * The skeleton used for the mesh animation (and the debug viewer) is the first found one.
     */    
    public findSkeleton() {
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
    }

    /**
     * Run the animation between the character position and its first destination
     */
    public start() {
        // If at least one destination
        if (this.destinations.length >= 1) {
            // Animate the character
            this.playAnimation('walk', true, 1);
            // Move to the next destination
            this._moveToNextDestination();
        }
    }
    

    /**
     * Removes all destination of the minion
     */
    public stop() {
        this.destinations = [];
        this.pause();
    }

    /**
     * Pause the character movement
     */
    public pause() {
        this.isMoving = false;
        // Animate the character in idle animation
        this.playAnimation('idle', true, 1);
    }

    /**
     * Resume the character movement
     */
    public resume() {
        this.isMoving = true;
        // Animate the character
        this.playAnimation('walk', true, 1);
    }

    /**
     * Move the character to its destination.
     * The character y position is set according to the ground position (or 0 if no ground).
     * The attribute _canMove is reset to false when the destination is reached.
     */
    private _move() {
        // If a destination has been set and the character has not been stopped
        if (this.isMoving && this._destination) {
            // Compute distance to destination
            let distance = BABYLON.Vector3.Distance(this._minion.position, this._destination.position);
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
                } else {
                    this._moveToNextDestination();
                }

            } else {
                this._lastDistance = distance;
                // Add direction to the position
                let delta = this._direction.scale(this._minion.getScene().getAnimationRatio()*this.speed);
                this._minion.position.addInPlace(delta);
            }
        }
    }

    /**
     * Add an animation to this character 
     */
    public addAnimation(name:string, from:number, to:number) {
        if (this.skeleton) {
            this.skeleton.createAnimationRange(name, from, to);
        }else {
            this._animations[name] = {from:from, to:to};
        }
    }

    /**
     * Play the given animation if skeleton found
     */
    public playAnimation(name:string, loop:boolean, speed:number = 1) {
        if (this.skeleton){
            this.skeleton.beginAnimation(name, loop, speed*this.animationSpeedMultiplier);
        } else {            
            let animation = this._animations[name];
            this._minion.getScene().beginAnimation(this._minion, animation.from, animation.to, loop, speed*this.animationSpeedMultiplier);
        }
    }
}