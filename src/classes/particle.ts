import { Utils } from '../utils/utils';
import { ParticleImage, Color, Coordinates, Rgb, Hsl } from '../utils/interfaces';
import { Container } from './container';
import { ShapeType, MoveDirection, HoverMode, ClickMode, ProcessBubbleType, OutMode } from '../utils/enums';

'use strict';

export class Particle {
    pJSContainer: Container;
    radius: number;
    size_status?: boolean;
    vs?: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    color: Color;
    opacity: number;
    opacity_status?: boolean;
    vo?: number;
    vx: number;
    vy: number;
    vx_i: number;
    vy_i: number;
    shape?: ShapeType;
    img?: ParticleImage;
    radius_bubble?: number;
    opacity_bubble?: number;
    text?: string;

    /* --------- pJS functions - particles ----------- */
    constructor(pJSContainer: Container, color: { value: string[] | Color | string }, opacity: number, position?: Coordinates) {
        this.pJSContainer = pJSContainer;
        let options = pJSContainer.options;

        /* size */
        this.radius = (options.particles.size.random ? Math.random() : 1) * options.particles.size.value;
        if (options.particles.size.anim.enable) {
            this.size_status = false;
            this.vs = options.particles.size.anim.speed / 100;
            if (!options.particles.size.anim.sync) {
                this.vs = this.vs * Math.random();
            }
        }
        /* position */
        this.x = position ? position.x : Math.random() * pJSContainer.canvas.w;
        this.y = position ? position.y : Math.random() * pJSContainer.canvas.h;
        /* check position  - into the canvas */
        if (this.x > pJSContainer.canvas.w - this.radius * 2)
            this.x = this.x - this.radius;
        else if (this.x < this.radius * 2)
            this.x = this.x + this.radius;
        if (this.y > pJSContainer.canvas.h - this.radius * 2)
            this.y = this.y - this.radius;
        else if (this.y < this.radius * 2)
            this.y = this.y + this.radius;
        /* parallax */
        this.offsetX = 0;
        this.offsetY = 0;

        /* check position - avoid overlap */
        if (options.particles.move.bounce) {
            this.checkOverlap(position);
        }

        /* color */
        this.color = {};
        if (typeof (color.value) == 'object') {
            if (color.value instanceof Array) {
                let arr = options.particles.color.value as string[];
                let color_selected = color.value[Math.floor(Math.random() * arr.length)];

                this.color.rgb = Utils.hexToRgb(color_selected);
            } else {

                let rgbColor = color.value as Rgb;

                if (rgbColor && rgbColor.r != undefined && rgbColor.g != undefined && rgbColor.b != undefined) {
                    this.color.rgb = {
                        r: rgbColor.r,
                        g: rgbColor.g,
                        b: rgbColor.b
                    };
                }

                let hslColor = color.value as Hsl;

                if (hslColor.h != undefined && hslColor.s != undefined && hslColor.l != undefined) {
                    this.color.hsl = {
                        h: hslColor.h,
                        s: hslColor.s,
                        l: hslColor.l
                    };
                }
            }
        } else if (typeof (color.value) == 'string') {
            if (color.value == 'random') {
                this.color.rgb = {
                    r: (Math.floor(Math.random() * (255 - 0 + 1)) + 0),
                    g: (Math.floor(Math.random() * (255 - 0 + 1)) + 0),
                    b: (Math.floor(Math.random() * (255 - 0 + 1)) + 0)
                };
            } else {
                this.color = {};
                this.color.rgb = Utils.hexToRgb(color.value);
            }
        }

        /* opacity */
        this.opacity = (options.particles.opacity.random ? Math.random() : 1) * options.particles.opacity.value;
        if (options.particles.opacity.anim.enable) {
            this.opacity_status = false;
            this.vo = options.particles.opacity.anim.speed / 100;
            if (!options.particles.opacity.anim.sync) {
                this.vo = this.vo * Math.random();
            }
        }

        /* animation - velocity for speed */
        let velbase: Coordinates;

        switch (options.particles.move.direction) {
            case MoveDirection.top:
                velbase = { x: 0, y: -1 };
                break;
            case MoveDirection.topRight:
                velbase = { x: 0.5, y: -0.5 };
                break;
            case MoveDirection.right:
                velbase = { x: 1, y: -0 };
                break;
            case MoveDirection.bottomRight:
                velbase = { x: 0.5, y: 0.5 };
                break;
            case MoveDirection.bottom:
                velbase = { x: 0, y: 1 };
                break;
            case MoveDirection.bottomLeft:
                velbase = { x: -0.5, y: 1 };
                break;
            case MoveDirection.left:
                velbase = { x: -1, y: 0 };
                break;
            case MoveDirection.topLeft:
                velbase = { x: -0.5, y: -0.5 };
                break;
            default:
                velbase = { x: 0, y: 0 };
                break;
        }

        if (options.particles.move.straight) {
            this.vx = velbase.x;
            this.vy = velbase.y;

            if (options.particles.move.random) {
                this.vx = this.vx * (Math.random());
                this.vy = this.vy * (Math.random());
            }
        }
        else {
            this.vx = velbase.x + Math.random() - 0.5;
            this.vy = velbase.y + Math.random() - 0.5;
        }

        // let theta = 2.0 * Math.PI * Math.random();

        // this.vx = Math.cos(theta);
        // this.vy = Math.sin(theta);

        this.vx_i = this.vx;
        this.vy_i = this.vy;
        /* if shape is image */
        let shape_type = options.particles.shape.type;

        if (shape_type instanceof Array) {
            let shape_selected = shape_type[Math.floor(Math.random() * shape_type.length)];
            this.shape = shape_selected;
        }
        else {
            this.shape = shape_type;
        }

        if (this.shape == ShapeType.image) {
            let sh = options.particles.shape;
            this.img = {
                src: sh.image.src,
                ratio: sh.image.width / sh.image.height,
                replace_color: sh.image.replace_color
            };
            if (!this.img.ratio)
                this.img.ratio = 1;
            // if (pJSContainer.img.type == 'svg' && pJSContainer.svg.source != undefined) {
            //     this.createSvgImg();

            //     if (pJSContainer.particles.pushing) {
            //         this.img.loaded = false;
            //     }
            // }
        }

        if (this.shape == ShapeType.char || this.shape == ShapeType.character) {
            if (typeof options.particles.shape.character.value === 'string') {
                this.text = options.particles.shape.character.value;
            } else {
                this.text = options.particles.shape.character.value[Math.floor(Math.random() * options.particles.shape.character.value.length)]
            }
        }
    }

    draw() {
        let pJS = this.pJSContainer;
        let options = pJS.options;
        let radius: number;
        let opacity;
        let color_value;

        if (this.radius_bubble != undefined) {
            radius = this.radius_bubble;
        } else {
            radius = this.radius;
        }

        if (this.opacity_bubble != undefined) {
            opacity = this.opacity_bubble;
        } else {
            opacity = this.opacity;
        }

        if (this.color.rgb) {
            color_value = `rgba(${this.color.rgb.r},${this.color.rgb.g},${this.color.rgb.b},${opacity})`;
        } else if (this.color.hsl) {
            color_value = `hsla(${this.color.hsl.h},${this.color.hsl.s}%,${this.color.hsl.l}%,${opacity})`;
        }

        if (!pJS.canvas.ctx || !color_value) return;

        pJS.canvas.ctx.fillStyle = color_value;
        pJS.canvas.ctx.beginPath();

        let p_x = this.x + this.offsetX;
        let p_y = this.y + this.offsetY;

        const ctx = pJS.canvas.ctx;

        switch (this.shape) {
            case ShapeType.line:
                ctx.moveTo(this.x, this.y)
                ctx.lineTo(this.x, this.y + radius)
                ctx.strokeStyle = options.particles.shape.stroke.color;
                ctx.lineWidth = options.particles.shape.stroke.width;
                ctx.stroke();
                break;

            case ShapeType.circle:
                ctx.arc(p_x, p_y, radius, 0, Math.PI * 2, false);
                break;
            case ShapeType.edge:
            case ShapeType.square:
                ctx.rect(this.x - radius, this.y - radius, radius * 2, radius * 2);
                break;
            case ShapeType.triangle:
                this.drawShape(ctx, this.x - radius, this.y + radius / 1.66, radius * 2, 3, 2);
                break;
            case ShapeType.polygon:
                {
                    const startX = this.x - radius / (options.particles.shape.polygon.nb_sides / 3.5);
                    const startY = this.y - radius / (2.66 / 3.5);
                    const sideLength = radius * 2.66 / (options.particles.shape.polygon.nb_sides / 3);
                    const sideCountNumerator = options.particles.shape.polygon.nb_sides;
                    const sideCountDenominator = 1;

                    this.drawShape(ctx, startX, startY, sideLength, sideCountNumerator, sideCountDenominator);
                }
                break;
            case ShapeType.star:
                {
                    const startX = this.x - radius * 2 / (options.particles.shape.polygon.nb_sides / 4);
                    const startY = this.y - radius / (2 * 2.66 / 3.5);
                    const sideLength = radius * 2 * 2.66 / (options.particles.shape.polygon.nb_sides / 3);
                    const sideCountNumerator = options.particles.shape.polygon.nb_sides;
                    const sideCountDenominator = 2;

                    this.drawShape(ctx, startX, startY, sideLength, sideCountNumerator, sideCountDenominator);
                }
                break;

            case ShapeType.heart:
                let x = this.x - radius / 2;
                let y = this.y - radius / 2;

                ctx.moveTo(x, y + radius / 4);
                ctx.quadraticCurveTo(x, y, x + radius / 4, y);
                ctx.quadraticCurveTo(x + radius / 2, y, x + radius / 2, y + radius / 4);
                ctx.quadraticCurveTo(x + radius / 2, y, x + radius * 3 / 4, y);
                ctx.quadraticCurveTo(x + radius, y, x + radius, y + radius / 4);
                ctx.quadraticCurveTo(x + radius, y + radius / 2, x + radius * 3 / 4, y + radius * 3 / 4);
                ctx.lineTo(x + radius / 2, y + radius);
                ctx.lineTo(x + radius / 4, y + radius * 3 / 4);
                ctx.quadraticCurveTo(x, y + radius / 2, x, y + radius / 4);

                break;

            case ShapeType.char:
            case ShapeType.character:
                ctx.font = `${options.particles.shape.character.style} ${options.particles.shape.character.weight} ${Math.round(radius) * 2}px ${options.particles.shape.character.font}`;

                if (this.text !== undefined) {
                    if (options.particles.shape.character.fill) {
                        ctx.fillText(this.text, this.x - radius / 2, this.y + radius / 2);
                    } else {
                        ctx.strokeText(this.text, this.x - radius / 2, this.y + radius / 2);
                    }
                }
                break;

            case ShapeType.image:
                let img_obj: HTMLImageElement | undefined;

                // if (pJS.img.type == 'svg' && this.img) {
                //     img_obj = this.img.obj;
                // } else {
                img_obj = pJS.img.obj;
                // }

                if (img_obj) {
                    this.subDraw(ctx, img_obj, radius);
                }

                break;
        }

        pJS.canvas.ctx.closePath();

        if (options.particles.shape.stroke.width > 0) {
            pJS.canvas.ctx.strokeStyle = options.particles.shape.stroke.color;
            pJS.canvas.ctx.lineWidth = options.particles.shape.stroke.width;
            pJS.canvas.ctx.stroke();
        }

        pJS.canvas.ctx.fill();
    }

    subDraw(ctx: CanvasRenderingContext2D, img_obj: HTMLImageElement, radius: number) {
        let p = this;
        let ratio = 1;

        if (p.img) {
            ratio = p.img.ratio;
        }

        ctx.drawImage(img_obj, p.x - radius, p.y - radius, radius * 2, radius * 2 / ratio);
    }

    drawShape(ctx: CanvasRenderingContext2D, startX: number, startY: number, sideLength: number, sideCountNumerator: number, sideCountDenominator: number) {

        // By Programming Thomas - https://programmingthomas.wordpress.com/2013/04/03/n-sided-shapes/
        let sideCount = sideCountNumerator * sideCountDenominator;
        let decimalSides = sideCountNumerator / sideCountDenominator;
        let interiorAngleDegrees = (180 * (decimalSides - 2)) / decimalSides;
        let interiorAngle = Math.PI - Math.PI * interiorAngleDegrees / 180; // convert to radians

        ctx.save();
        ctx.beginPath();
        ctx.translate(startX, startY);
        ctx.moveTo(0, 0);

        for (let i = 0; i < sideCount; i++) {
            ctx.lineTo(sideLength, 0);
            ctx.translate(sideLength, 0);
            ctx.rotate(interiorAngle);
        }

        //c.stroke();
        ctx.fill();
        ctx.restore();
    }

    checkOverlap(position?: Coordinates) {
        const pJS = this.pJSContainer;
        const p = this;

        for (const p2 of pJS.particles.array) {
            let dx = p.x - p2.x;
            let dy = p.y - p2.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= p.radius + p2.radius) {
                p.x = position ? position.x : Math.random() * pJS.canvas.w;
                p.y = position ? position.y : Math.random() * pJS.canvas.h;

                p.checkOverlap();
            }
        }
    }

    // createSvgImg() {
    //     const pJS = this.pJSContainer;
    //     const p = this;

    //     /* set color to svg element */
    //     let svgXml = pJS.svg.source;

    //     if (!svgXml) return;

    //     let url: string;
    //     if (this.img && this.img.replace_color) {
    //         let rgbHex = /#([0-9A-F]{3,6})/gi;
    //         let coloredSvgXml = svgXml.replace(rgbHex, (substring: string) => {
    //             let color_value;

    //             if (p.color.rgb) {
    //                 color_value = `rgb(${p.color.rgb.r},${p.color.rgb.g},${p.color.rgb.b})`;
    //             } else if (p.color.hsl) {
    //                 color_value = `hsl(${p.color.hsl.h},${p.color.hsl.s}%,${p.color.hsl.l}%)`;
    //             }

    //             return color_value || substring;
    //         });
    //         url = 'data:image/svg+xml;utf8,' + coloredSvgXml;
    //     } else {
    //         url = 'data:image/svg+xml;utf8,' + svgXml;
    //     }
    //     /* prepare to create img with colored svg */
    //     // let svg = new Blob([coloredSvgXml], { type: 'image/svg+xml;charset=utf-8' });
    //     // let url = URL.createObjectURL(svg);
    //     /* create particle img obj */
    //     let img = new Image();
    //     img.addEventListener('load', () => {
    //         if (p.img) {
    //             p.img.obj = img;
    //             p.img.loaded = true;
    //         }

    //         // URL.revokeObjectURL(url);

    //         if (!pJS.svg.count)
    //             pJS.svg.count = 0;

    //         pJS.svg.count++;
    //     });
    //     img.src = url;
    // }

    initBubble() {
        this.opacity_bubble = this.opacity;
        this.radius_bubble = this.radius;
    }

    grab() {
        let pJS = this.pJSContainer;
        let options = pJS.options;

        if (options.interactivity.events.onhover.enable && pJS.interactivity.status == 'mousemove') {
            let dx_mouse = this.x - (pJS.interactivity.mouse.pos_x || 0);
            let dy_mouse = this.y - (pJS.interactivity.mouse.pos_y || 0);
            let dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
            /* draw a line between the cursor and the particle if the distance between them is under the config distance */
            if (dist_mouse <= options.interactivity.modes.grab.distance) {
                let opacity_line = options.interactivity.modes.grab.line_linked.opacity - (dist_mouse / (1 / options.interactivity.modes.grab.line_linked.opacity)) / options.interactivity.modes.grab.distance;

                if (opacity_line > 0) {
                    /* style */
                    pJS.particles.line_linked_color = pJS.particles.line_linked_color || Utils.hexToRgb(options.particles.line_linked.color);

                    let color_line = pJS.particles.line_linked_color || { r: 127, g: 127, b: 127 };

                    if (pJS.canvas.ctx) {
                        pJS.canvas.ctx.strokeStyle = `rgba(${color_line.r},${color_line.g},${color_line.b},${opacity_line})`;
                        pJS.canvas.ctx.lineWidth = options.particles.line_linked.width;
                        //pJS.canvas.ctx.lineCap = 'round'; /* performance issue */
                        /* path */
                        pJS.canvas.ctx.beginPath();
                        pJS.canvas.ctx.moveTo(this.x + this.offsetX, this.y + this.offsetY);
                        pJS.canvas.ctx.lineTo((pJS.interactivity.mouse.pos_x || 0), (pJS.interactivity.mouse.pos_y || 0));
                        pJS.canvas.ctx.stroke();
                        pJS.canvas.ctx.closePath();
                    }
                }
            }
        }
    }

    bubble() {
        const pJS = this.pJSContainer;
        const options = pJS.options;

        /* on hover event */
        if (options.interactivity.events.onhover.enable && Utils.isInArray(HoverMode.bubble, options.interactivity.events.onhover.mode)) {
            let dx_mouse = (this.x + this.offsetX) - (pJS.interactivity.mouse.pos_x || 0);
            let dy_mouse = (this.y + this.offsetY) - (pJS.interactivity.mouse.pos_y || 0);
            let dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
            let ratio = 1 - dist_mouse / options.interactivity.modes.bubble.distance;

            /* mousemove - check ratio */
            if (dist_mouse <= options.interactivity.modes.bubble.distance) {
                if (ratio >= 0 && pJS.interactivity.status == 'mousemove') {
                    /* size */
                    if (options.interactivity.modes.bubble.size != options.particles.size.value) {
                        if (options.interactivity.modes.bubble.size > options.particles.size.value) {
                            let size = this.radius + (options.interactivity.modes.bubble.size * ratio);
                            if (size >= 0) {
                                this.radius_bubble = size;
                            }
                        } else {
                            let dif = this.radius - options.interactivity.modes.bubble.size;
                            let size = this.radius - (dif * ratio);

                            if (size > 0) {
                                this.radius_bubble = size;
                            } else {
                                this.radius_bubble = 0;
                            }
                        }
                    }
                    /* opacity */
                    if (options.interactivity.modes.bubble.opacity != options.particles.opacity.value) {
                        if (options.interactivity.modes.bubble.opacity > options.particles.opacity.value) {
                            let opacity = options.interactivity.modes.bubble.opacity * ratio;
                            if (opacity > this.opacity && opacity <= options.interactivity.modes.bubble.opacity) {
                                this.opacity_bubble = opacity;
                            }
                        }
                        else {
                            let opacity = this.opacity - (options.particles.opacity.value - options.interactivity.modes.bubble.opacity) * ratio;
                            if (opacity < this.opacity && opacity >= options.interactivity.modes.bubble.opacity) {
                                this.opacity_bubble = opacity;
                            }
                        }
                    }
                }
            } else {
                this.initBubble();
            }

            /* mouseleave */
            if (pJS.interactivity.status == 'mouseleave') {
                this.initBubble();
            }
        } else if (options.interactivity.events.onclick.enable && Utils.isInArray(ClickMode.bubble, options.interactivity.events.onclick.mode)) {
            /* on click event */
            let dx_mouse = this.x - (pJS.interactivity.mouse.click_pos_x || 0);
            let dy_mouse = this.y - (pJS.interactivity.mouse.click_pos_y || 0);
            let dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
            let time_spent = (new Date().getTime() - (pJS.interactivity.mouse.click_time || 0)) / 1000;

            if (pJS.bubble.clicking) {
                if (time_spent > options.interactivity.modes.bubble.duration) {
                    pJS.bubble.duration_end = true;
                }

                if (time_spent > options.interactivity.modes.bubble.duration * 2) {
                    pJS.bubble.clicking = false;
                    pJS.bubble.duration_end = false;
                }
            }

            if (pJS.bubble.clicking) {
                /* size */
                pJS.processBubble(this, dist_mouse, time_spent, options.interactivity.modes.bubble.size, options.particles.size.value, this.radius_bubble, this.radius, ProcessBubbleType.size);
                /* opacity */
                pJS.processBubble(this, dist_mouse, time_spent, options.interactivity.modes.bubble.opacity, options.particles.opacity.value, this.opacity_bubble, this.opacity, ProcessBubbleType.opacity);
            }
        }
    }

    repulse() {
        const pJS = this.pJSContainer;
        const options = pJS.options;

        if (options.interactivity.events.onhover.enable && Utils.isInArray(HoverMode.repulse, options.interactivity.events.onhover.mode) && pJS.interactivity.status == 'mousemove') {
            let dx_mouse = this.x - (pJS.interactivity.mouse.pos_x || 0);
            let dy_mouse = this.y - (pJS.interactivity.mouse.pos_y || 0);
            let dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
            let normVec = { x: dx_mouse / dist_mouse, y: dy_mouse / dist_mouse };
            let repulseRadius = options.interactivity.modes.repulse.distance, velocity = 100;
            let repulseFactor = Utils.clamp((1 / repulseRadius) * (-1 * Math.pow(dist_mouse / repulseRadius, 2) + 1) * repulseRadius * velocity, 0, 50);
            let pos = {
                x: this.x + normVec.x * repulseFactor,
                y: this.y + normVec.y * repulseFactor
            };

            if (options.particles.move.out_mode == OutMode.bounce || options.particles.move.out_mode == OutMode.bounceVertical) {
                if (pos.x - this.radius > 0 && pos.x + this.radius < pJS.canvas.w)
                    this.x = pos.x;
                if (pos.y - this.radius > 0 && pos.y + this.radius < pJS.canvas.h)
                    this.y = pos.y;
            } else {
                this.x = pos.x;
                this.y = pos.y;
            }
        } else if (options.interactivity.events.onclick.enable && Utils.isInArray(ClickMode.repulse, options.interactivity.events.onclick.mode)) {
            if (!pJS.repulse.finish) {

                if (!pJS.repulse.count)
                    pJS.repulse.count = 0;

                pJS.repulse.count++;

                if (pJS.repulse.count == pJS.particles.array.length) {
                    pJS.repulse.finish = true;
                }
            }

            if (pJS.repulse.clicking) {
                let repulseRadius = Math.pow(options.interactivity.modes.repulse.distance / 6, 3);
                let dx = (pJS.interactivity.mouse.click_pos_x || 0) - this.x;
                let dy = (pJS.interactivity.mouse.click_pos_y || 0) - this.y;
                let d = dx * dx + dy * dy;
                let force = -repulseRadius / d;

                // default
                if (d <= repulseRadius) {
                    this.processRepulse(dx, dy, force);
                }
                // bang - slow motion mode
                // if(!pJS.repulse_finish){
                //   if(d <= repulseRadius){
                //     process();
                //   }
                // }else{
                //   process();
                // }
            } else if (pJS.repulse.clicking === false) {
                this.vx = this.vx_i;
                this.vy = this.vy_i;
            }
        }
    }

    processRepulse(dx: number, dy: number, force: number) {
        let pJS = this.pJSContainer;
        let options = pJS.options;

        let f = Math.atan2(dy, dx);

        this.vx = force * Math.cos(f);
        this.vy = force * Math.sin(f);

        if (options.particles.move.out_mode == OutMode.bounce || options.particles.move.out_mode == OutMode.bounceVertical) {
            let pos = {
                x: this.x + this.vx,
                y: this.y + this.vy
            };

            if (pos.x + this.radius > pJS.canvas.w)
                this.vx = -this.vx;
            else if (pos.x - this.radius < 0)
                this.vx = -this.vx;

            if (pos.y + this.radius > pJS.canvas.h)
                this.vy = -this.vy;
            else if (pos.y - this.radius < 0)
                this.vy = -this.vy;
        }
    }

    /* ---------- pJS functions - particles interaction ------------ */
    link(p2: Particle) {
        const pJS = this.pJSContainer;
        const options = pJS.options;

        const x1 = this.x + this.offsetX;
        const x2 = p2.x + p2.offsetX;
        const dx = x1 - x2;
        const y1 = this.y + this.offsetY;
        const y2 = p2.y + p2.offsetY;
        const dy = y1 - y2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        /* draw a line between p1 and p2 if the distance between them is under the config distance */
        if (dist <= options.particles.line_linked.distance) {
            const opacity_line = options.particles.line_linked.opacity - (dist * options.particles.line_linked.opacity) / options.particles.line_linked.distance;

            if (opacity_line > 0) {
                /* style */
                if (!pJS.particles.line_linked_color) {
                    pJS.particles.line_linked_color = Utils.hexToRgb(options.particles.line_linked.color);
                }

                if (!pJS.canvas.ctx) return;

                const ctx = pJS.canvas.ctx;

                const color_line = pJS.particles.line_linked_color;

                if (color_line) {
                    ctx.strokeStyle = `rgba(${color_line.r},${color_line.g},${color_line.b},${opacity_line})`;
                }

                ctx.lineWidth = options.particles.line_linked.width;
                //pJS.canvas.ctx.lineCap = 'round'; /* performance issue */
                /* path */
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    attract(p2: Particle) {
        let pJS = this.pJSContainer;
        let options = pJS.options;

        /* condensed particles */
        let dx = this.x - p2.x;
        let dy = this.y - p2.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= options.particles.line_linked.distance) {
            let ax = dx / (options.particles.move.attract.rotateX * 1000);
            let ay = dy / (options.particles.move.attract.rotateY * 1000);

            this.vx -= ax;
            this.vy -= ay;
            p2.vx += ax;
            p2.vy += ay;
        }
    }

    bounce(p2: Particle) {
        let dx = this.x - p2.x;
        let dy = this.y - p2.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let dist_p = this.radius + p2.radius;

        if (dist <= dist_p) {
            this.vx = -this.vx;
            this.vy = -this.vy;
            p2.vx = -p2.vx;
            p2.vy = -p2.vy;
        }
    }
}