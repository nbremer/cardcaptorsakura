
//TODO: Fix x and y of color circles?
// var data_save;
// var data_new = []
// data_save.forEach(function(d) {
//     data_new.push({country_id: d.country_id, x: round(d.x,2), y: round(d.y,2)})
// })
// copy(data_new)

function create_CCS_chart() {

    ////////////////////////////////////////////////////////////// 
    ////////////////// Set-up sizes of the page //////////////////
    ////////////////////////////////////////////////////////////// 
    
    var container = d3.select("#chart");
    
    window.scroll(0,window.pageYOffset);
    //Remove anything that was still there
    container.selectAll("svg, canvas").remove();
    container.style("height", null);
    document.body.style.width = null;
    d3.selectAll(".outer-container")
        .style("width", null)
        .style("margin-left", null)
        .style("margin-right", null)
        .style("padding-left", null)
        .style("padding-right", null);
    d3.selectAll(".manga-img").style("display", null);
    d3.selectAll(".manga-mobile-img").style("display", null);
    d3.selectAll(".manga-img div")
        .style("height", null)
        .style("width", null);
    d3.selectAll(".character-group").style("height", null);
    d3.select("#annotation-explanation").style("display", null);


    var base_width = 1600;
    var ww = window.innerWidth,
        wh = window.innerHeight;
    var width_too_small = ww < 500;

    var width;
    if(wh < ww) {
        width = wh/0.7;
    } else {
        if(ww < width_too_small) width = ww/0.5;
        else if(ww < 600) width = ww/0.6;
        else if(ww < 800) width = ww/0.7;
        else if(ww < 1100) width = ww/0.8;
        else width = ww/0.8;
    }//else
    width = Math.round(Math.min(base_width, width));
    var height = width;

    //Scaling the entire visual, as compared to the base size
    var size_factor = width/base_width;

    //Adjust the general layout based on the width of the visual
    container.style("height", height + "px");
    //Reset the body width
    var annotation_padding = width_too_small ? 0 : 240 * size_factor;
    var total_chart_width = width + annotation_padding;
    var no_scrollbar_padding = total_chart_width > ww ? 0 : 20;
    if(total_chart_width > ww) document.body.style.width = total_chart_width + 'px';
    var outer_container_width = Math.min(base_width, ww - no_scrollbar_padding - 2*20); //2 * 20px padding
    d3.selectAll(".outer-container").style("width", outer_container_width + "px"); 

    //Update the sizes of the images in the introduction
    if(ww > 900) {
        //Adjust the sizes of the images in the intro
        for(var i = 1; i <= 2 ; i++) {
            var par_height = document.getElementById("character-text-" + i).getBoundingClientRect().height;
            var div_width = document.getElementById("character-intro").getBoundingClientRect().width;
            if(total_chart_width > ww) var width_left = (parseInt(document.body.style.width) - div_width)/2;
            else var width_left = (window.innerWidth - div_width)/2 - 10;

            var max_width = par_height*1.99;
            var window_based_width = div_width*0.48 + width_left;
            if(window_based_width > max_width) par_height = window_based_width/1.99;

            d3.select("#manga-img-" + i)
                .style("height", par_height + "px")
                .style("width", Math.min(par_height*1.99, window_based_width) + "px") //width img = 45%
                .style("display","block");

            d3.select("#character-group-" + i).style("height", par_height + "px");
        }//for i
        d3.selectAll(".manga-mobile-img").style("display","hidden");
    } else {
        d3.selectAll(".manga-mobile-img").style("display","block");
        d3.selectAll(".manga-img").style("display","hidden");
    }//else

    //Do the read-more button
    d3.selectAll(".read-more").style("display","none");
    var do_display_more = false;
    d3.select("#read-more-button p")
        .style("display","inline-block")
        .html("read more...")
        .on("click", function() {
            do_display_more = !do_display_more;
            d3.select("#read-more-button p").html(do_display_more ? "hide extra info" : "read more...");
            d3.selectAll(".read-more").style("display", do_display_more ? null : "none");
        });

    //Move the window to the top left of the text if the chart is wider than the screen
    if(total_chart_width > ww) {
        var pos = document.getElementById("top-outer-container").getBoundingClientRect();
        var scrollX = pos.left - 15;
        if(total_chart_width - ww < pos.left) {
            scrollX = (total_chart_width - ww)/2; 
        } else if(outer_container_width >= base_width) scrollX = pos.left - (parseInt(document.body.style.width) - pos.width)/4 - 10;
        //Scroll to the new position on the horizontal
        window.scrollTo(scrollX,window.pageYOffset);

        //This doesn't work in all browsers, so check (actually it only doesn't seem to work in Chrome mobile...)
        if( Math.abs(window.scrollX - scrollX) > 2 ) {
            window.scrollTo(0,window.pageYOffset)
            d3.selectAll(".outer-container")
                .style("margin-left", 0 + "px")
                .style("margin-right", 0 + "px")
                .style("padding-left", 30 + "px")
                .style("padding-right", 30 + "px")
        }//if
    }//if

    document.querySelector('html').style.setProperty('--annotation-title-font-size', Math.min(14,15*size_factor) + 'px')
    document.querySelector('html').style.setProperty('--annotation-label-font-size', Math.min(14,15*size_factor) + 'px')

    ////////////////////////////////////////////////////////////// 
    //////////////////// Create SVG & Canvas /////////////////////
    ////////////////////////////////////////////////////////////// 

    //Canvas
    var canvas = container.append("canvas").attr("id", "canvas-target")
    var ctx = canvas.node().getContext("2d");
    crispyCanvas(canvas, ctx, 2);
    ctx.translate(width/2,height/2);
    //General canvas settings
    ctx.globalCompositeOperation = "multiply";
    ctx.lineCap = "round";
    ctx.lineWidth = 3 * size_factor;

    //SVG container
    var svg = container.append("svg")
        .attr("id","CCS-SVG")
        .attr("width", width)
        .attr("height", height);

    var chart = svg.append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    // //Test to see the window width on mobile
    // chart.append("text")
    //     .attr("x", -width/2 + 20)
    //     .attr("y", -height/2 + 20)
    //     .style("fill","black")
    //     .text(ww)

    var defs = chart.append("defs");

    //////////////////////////////////////////////////////////////
    //////////////// Initialize helpers and scales ///////////////
    //////////////////////////////////////////////////////////////

    var num_chapters = 50,
        num_volume = 12;
    var pi2 = 2*Math.PI,
        pi1_2 = Math.PI/2;

    var cover_alpha = 0.3;
    var simulation;
    var remove_text_timer;

    var color_sakura = "#EB5580",
        color_kero = "#F6B42B",
        color_syaoran = "#4fb127";

    //Has a mouseover just happened
    var mouse_over_in_action = false;

    //Radii at which the different parts of the visual should be created
    var rad_card_label = width * 0.4, //capture card text on the outside
        rad_cover_outer = width * 0.395, //outside of the hidden cover hover
        rad_cover_inner = width * 0.350, //inside of the hidden cover hover
        // rad_volume_donut_outer = width * 0.427, //outer radius of the volume donut
        // rad_volume_donut_inner = width * 0.425, //inner radius of the volume donut
        rad_color = width * 0.373, //color circles' center
        rad_chapter_outer = width * 0.3499, //outside of the hidden chapter hover
        rad_volume_inner = width * 0.343, //radius of the volume arcs
        rad_chapter_donut_outer = width * 0.334, //outer radius of the chapter donut
        rad_chapter_donut_inner = width * 0.32, //inner radius of the chapter donut
        rad_chapter_inner = width * 0.30, //outside of the hidden chapter hover
        rad_dot_color = width * 0.32, //chapter dot
        rad_line_max = 0.31,
        rad_line_min = 0.215,
        rad_line_label = width * 0.29, //textual label that explains the hovers
        rad_donut_inner = width * 0.122, //inner radius of the character donut
        rad_donut_outer = width * 0.13, //outer radius of the character donut
        rad_name = rad_donut_outer + 8 * size_factor, //padding between character donut and start of the character name
        rad_image = rad_donut_inner - 4 * size_factor; //radius of the central image shown on hover
        rad_relation = rad_donut_inner - 8 * size_factor; //padding between character donut and inner lines

    //Angle for each chapter on the outside
    var angle = d3.scaleLinear()
        .domain([0, num_chapters])
        .range([pi2/num_chapters/2, pi2 + pi2/num_chapters/2]);

    //Radius scale for the color circles
    var radius_scale = d3.scaleSqrt()
        .domain([0, 1])
        .range([0, 20]);

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////// Create groups ///////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////////////////////
    //////////////////////////// Read in the data /////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    d3.queue()
        .defer(d3.json, "data/ccs_chapter_hierarchy.json")
        .defer(d3.json, "data/ccs_chapter_total.json")
        .defer(d3.json, "data/ccs_character_per_chapter.json")
        .defer(d3.json, "data/ccs_character_per_chapter_cover.json")
        .defer(d3.csv, "data/ccs_character_total.csv")
        .defer(d3.csv, "data/ccs_character_relations.csv")
        .defer(d3.json, "data/ccs_color_distribution.json")
        .await(draw);

    function draw(error, chapter_hierarchy_data, chapter_total_data, character_data, cover_data, character_total_data, relation_data, color_data) {

        if (error) throw error;

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Calculate chapter locations /////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        chapter_hierarchy_data = chapter_hierarchy_data.filter(function (d) { return d.name === "CCS" || (d.volume_num <= num_volume && !d.num) || (d.num >= 1 && d.num <= num_chapters); });
        //Based on typical hierarchical clustering example
        var root = d3.stratify()
            .id(function (d) { return d.name; })
            .parentId(function (d) { return d.parent; })
            (chapter_hierarchy_data);
        var cluster = d3.cluster()
            .size([360, rad_dot_color])
            .separation(function separation(a, b) {
                return a.parent == b.parent ? 1 : 1.3;
            });
        cluster(root);
        var chapter_location_data = root.leaves()
        chapter_location_data.forEach(function (d, i) {
            d.centerAngle = d.x * Math.PI / 180;
        });

        //The distance between two chapters that belong to the same volume
        var chapter_angle_distance = chapter_location_data[1].centerAngle - chapter_location_data[0].centerAngle;

        //Add some useful metrics to the chapter data
        chapter_location_data.forEach(function (d, i) {
            d.startAngle = d.centerAngle - chapter_angle_distance / 2;
            d.endAngle = d.centerAngle + chapter_angle_distance / 2;
        })

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Final data prep /////////////////////////////
        ///////////////////////////////////////////////////////////////////////////

        character_total_data.forEach(function (d) {
            d.num_chapters = +d.num_chapters;
        })//forEach
        var character_names = character_total_data.map(function(d) { return d.character; });

        //Sort cover data according to characters from total
        function sortCharacter(a, b) { return character_names.indexOf(a.character) - character_names.indexOf(b.character); }
        cover_data.sort(sortCharacter);
        character_data.sort(sortCharacter);

        color_data = color_data.filter(function (d) { return d.chapter <= num_chapters; })
        color_data.forEach(function (d) {
            d.cluster = d.chapter - 1;
            d.radius = radius_scale(d.percentage);

            //The center of gravity for this datapoint
            d.focusX = rad_color * Math.cos(chapter_location_data[d.cluster].centerAngle - pi1_2);
            d.focusY = rad_color * Math.sin(chapter_location_data[d.cluster].centerAngle - pi1_2);
            //Add a bit of random to not get weird placement behavior in the simulation
            d.x = d.focusX + random();
            d.y = d.focusY + random();
        })//forEach

        ///////////////////////////////////////////////////////////////////////////
        /////////////////////////// Run force simulation //////////////////////////
        ///////////////////////////////////////////////////////////////////////////   
        
        simulation = d3.forceSimulation(color_data)
            .force("x", d3.forceX().x(function (d) { return d.focusX; }).strength(0.05))
            .force("y", d3.forceY().y(function (d) { return d.focusY; }).strength(0.05))
            .force("collide", d3.forceCollide(function (d) { return (d.radius * 1 + 2.5) * size_factor; }).strength(0))
            .on("tick", tick)
            .on("end", simulation_end)
            .alphaMin(.2)
            //.stop();

        //Run the simulation "manually"
        //for (var i = 0; i < 300; ++i) simulation.tick();

        //Ramp up collision strength to provide smooth transition
        var t = d3.timer(function (elapsed) {
            var dt = elapsed / 3000;
            simulation.force("collide").strength(Math.pow(dt, 2) * 0.7);
            if (dt >= 1.0) t.stop();
        });

        function tick(e) {
            color_circle
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
        }//function tick

        //When the simulation is done, run this function
        function simulation_end() {
            //Create the CMYK halftones
            color_circle.style("fill", function (d, i) { return "url(#pattern-total-" + i + ")"; })
        }//function simulation_end

        data_save = color_data; //So I save the final positions

        //////////////////////////////////////////////////////////////
        /////////////// Create circle for cover image ////////////////
        //////////////////////////////////////////////////////////////

        //Adding images of the characters
        var image_radius = rad_image;
        var image_group = defs.append("g").attr("class", "image-group");
        //Had to add img width otherwise it wouldn't work in Safari & Firefox
        //http://stackoverflow.com/questions/36390962/svg-image-tag-not-working-in-safari-and-firefox
        var cover_image = image_group.append("pattern")
            .attr("id", "cover-image")
            .attr("class", "cover-image")
            .attr("patternUnits", "objectBoundingBox")
            .attr("height", "100%")
            .attr("width", "100%")
            .append("image")
            .attr("xlink:href", "img/white-square.jpg")
            .attr("height", 2 * image_radius)
            .attr("width", 2 * image_radius);

        ///////////////////////////////////////////////////////////////////////////
        /////////////////////// Create character donut chart //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Arc command for the character donut chart
        var arc = d3.arc()
            .outerRadius(rad_donut_outer)
            .innerRadius(rad_donut_inner)
            .padAngle(0.01)
            .cornerRadius((rad_donut_outer - rad_donut_inner) / 2 * 1)
        //Pie function to calculate sizes of donut slices
        var pie = d3.pie()
            .sort(null)
            .value(function (d) { return d.num_chapters; });

        var arcs = pie(character_total_data);
        arcs.forEach(function(d,i) {
            d.character = character_total_data[i].character;
            d.centerAngle = (d.endAngle - d.startAngle) / 2 + d.startAngle;
        });

        //Create the donut slices per character (and the number of chapters they appeared in)
        var donut_group = chart.append("g").attr("class", "donut-group");
        var slice = donut_group.selectAll(".arc")
            .data(arcs)
            .enter().append("path")
            .attr("class", "arc")
            .attr("d", arc)
            .style("fill", function (d) { return d.data.color; });

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Create name labels //////////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var hover_circle_group = chart.append("g").attr("class", "hover-circle-group");
        var name_group = chart.append("g").attr("class", "name-group");

        //Create a group per character
        var names = name_group.selectAll(".name")
            .data(arcs)
            .enter().append("g")
            .attr("class", "name")
            .style("text-anchor", function (d) { return d.centerAngle > 0 & d.centerAngle < Math.PI ? "start" : "end";; })
            .style("font-family", "Anime Ace")
            
        //Add the big "main" name
        names.append("text")
            .attr("class", "name-label")
            .attr("id", function (d, i) { return "name-label-" + i; })
            .attr("dy", ".35em")
            .attr("transform", function (d, i) {
                //If there is a last name, move the first a bit upward
                if(character_total_data[i].last_name !== "") {
                    var finalAngle = d.centerAngle + (d.centerAngle > 0 & d.centerAngle < Math.PI ? -0.02 : 0.02);
                } else {
                    var finalAngle = d.centerAngle;
                }//else
                return "rotate(" + (finalAngle * 180 / Math.PI - 90) + ")"
                    + "translate(" + rad_name + ")"
                    + (finalAngle > 0 & finalAngle < Math.PI ? "" : "rotate(180)");
            })
            .style("font-size", (12*size_factor)+"px")
            .text(function (d, i) { return character_total_data[i].first_name; });

        //Add the smaller last name (if available) below
        names.append("text")
            .attr("class", "last-name-label")
            .attr("id", function (d, i) { return "last-name-label-" + i; })
            .attr("dy", ".35em")
            .attr("transform", function (d, i) {
                //If there is a last name, move the last a bit downward
                if(character_total_data[i].last_name !== "") {
                    var finalAngle = d.centerAngle + (d.centerAngle > 0 & d.centerAngle < Math.PI ? 0.03 : -0.03);
                } else {
                    var finalAngle = d.centerAngle;
                }//else
                return "rotate(" + (finalAngle * 180 / Math.PI - 90) + ")"
                    + "translate(" + rad_name + ")"
                    + (finalAngle > 0 & finalAngle < Math.PI ? "" : "rotate(180)");
            })
            .style("font-size", (9*size_factor)+"px")
            .text(function (d, i) { return character_total_data[i].last_name; });

        //Add one more line for the classmates label
        names.filter(function(d,i) { return i === arcs.length - 1; })
            .append("text")
            .attr("class", "last-name-label")
            .attr("dy", ".35em")
            .attr("y", "1.35em")
            .attr("transform", function (d, i) {
                var finalAngle = (d.endAngle - d.startAngle) / 2 + d.startAngle - 0.03;
                return "rotate(" + (finalAngle * 180 / Math.PI - 90) + ")"
                    + "translate(" + rad_name + ")rotate(180)";
            })
            .style("font-size", (9*size_factor)+"px")
            .text("Rika, Yamazaki");

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Create name dots ////////////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var characterByName = [];
        //Color of the dot behind the name can be the type
        character_total_data.forEach(function (d, i) {
            var text_width_first = document.getElementById('name-label-' + i).getComputedTextLength();
            var text_width_last = document.getElementById('last-name-label-' + i).getComputedTextLength();
            d.dot_name_rad = rad_name + Math.max(text_width_first,text_width_last) + 10;
            d.name_angle = (arcs[i].endAngle - arcs[i].startAngle) / 2 + arcs[i].startAngle;

            characterByName[d.character] = d;
        })//forEach

        //Create hover circle that shows when you hover over a character
        var rad_hover_circle = 35 * size_factor;
        var hover_circle = hover_circle_group.selectAll(".hover-circle")
            .data(character_total_data)
            .enter().append("circle")
            .attr("class", "hover-circle")
            .attr("cx", function (d) { return d.dot_name_rad * Math.cos(d.name_angle - pi1_2); })
            .attr("cy", function (d) { return d.dot_name_rad * Math.sin(d.name_angle - pi1_2); })
            .attr("r", rad_hover_circle)
            .style("fill", function (d) { return d.color; })
            .style("fill-opacity", 0.3)
            .style("opacity", 0);

        //Add a circle at the end of each name of each character
        var name_dot_group = chart.append("g").attr("class", "name-dot-group");
        var name_dot = name_dot_group.selectAll(".type-dot")
            .data(character_total_data)
            .enter().append("circle")
            .attr("class", "type-dot")
            .attr("cx", function (d) { return d.dot_name_rad * Math.cos(d.name_angle - pi1_2); })
            .attr("cy", function (d) { return d.dot_name_rad * Math.sin(d.name_angle - pi1_2); })
            .attr("r", 6 * size_factor)
            .style("fill", function (d) { return d.color; })
            .style("stroke", "white")
            .style("stroke-width", 3 * size_factor);

        ///////////////////////////////////////////////////////////////////////////
        ////////////////////////// Create inner relations /////////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var pull_scale = d3.scaleLinear()
            .domain([2 * rad_relation, 0])
            .range([0.7, 2.3]);
        var color_relation = d3.scaleOrdinal()
            .domain(["family", "crush", "love", "friends", "master"]) //"teacher","ex-lovers","reincarnation","rival"
            .range(["#2C9AC6", "#FA88A8", "#E01A25", "#7EB852", "#F6B42B"])
            .unknown("#bbbbbb");
        var stroke_relation = d3.scaleOrdinal()
            .domain(["family", "crush", "love", "friends", "master"]) //"teacher","ex-lovers","reincarnation","rival"
            .range([4, 5, 8, 4, 5])
            .unknown(3);

        var relation_group = chart.append("g").attr("class", "relation-group");

        //Create the lines in between the characters that have some sort of relation
        var relation_lines = relation_group.selectAll(".relation-path")
            .data(relation_data)
            .enter().append("path")
            .attr("class", "relation-path")
            .style("fill", "none")
            .style("stroke", function (d) { return color_relation(d.type); })
            .style("stroke-width", function (d) { return stroke_relation(d.type) * size_factor; })
            .style("stroke-linecap", "round")
            .style("mix-blend-mode", "multiply")
            .style("opacity", 0.7)
            .attr("d", create_relation_lines);

        function create_relation_lines(d) {
            var source_a = characterByName[d.source].name_angle,
                target_a = characterByName[d.target].name_angle;
            var x1 = rad_relation * Math.cos(source_a - pi1_2),
                y1 = rad_relation * Math.sin(source_a - pi1_2),
                x2 = rad_relation * Math.cos(target_a - pi1_2),
                y2 = rad_relation * Math.sin(target_a - pi1_2);
            var dx = x2 - x1,
                dy = y2 - y1,
                dr = Math.sqrt(dx * dx + dy * dy);
            var curve = dr * 1 / pull_scale(dr);

            //Get the angles to determine the optimum sweep flag
            var delta_angle = (target_a - source_a) / Math.PI;
            var sweep_flag = 0;
            if ((delta_angle > -1 && delta_angle <= 0) || (delta_angle > 1 && delta_angle <= 2))
                sweep_flag = 1;

            return "M" + x1 + "," + y1 + " A" + curve + "," + curve + " 0 0 " + sweep_flag + " " + x2 + "," + y2;
        }//function create_relation_lines

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////// Create inner relation hover areas ///////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var relation_hover_group = chart.append("g").attr("class", "relation-hover-group");
        var relation_hover_lines = relation_hover_group.selectAll(".relation-hover-path")
            .data(relation_data)
            .enter().append("path")
            .attr("class", "relation-hover-path")
            .style("fill", "none")
            .style("stroke", "white")
            .style("stroke-width", 16 * size_factor)
            .style("opacity", 0)
            // .style("pointer-events", "all")
            .attr("d", create_relation_lines)
            .on("mouseover", mouse_over_relation)
            .on("mouseout", mouse_out)

        //Call and create the textual part of the annotations
        var annotation_relation_group = chart.append("g").attr("class", "annotation-relation-group");

        function mouse_over_relation(d,i) {
            d3.event.stopPropagation();
            mouse_over_in_action = true;

            clearTimeout(remove_text_timer);

            //Only show the hovered relationship
            relation_lines.filter(function(c,j) { return j !== i; })
                .style("opacity", 0.05);

            //Set up the annotation
            var annotations_relationship = [
                {
                    note: {
                        label: d.note,
                        title: capitalizeFirstLetter(d.type),
                        wrap: 150*size_factor,
                    },
                    relation_type: "family",
                    x: +d.x * size_factor,
                    y: +d.y * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                }
            ];

            //Set-up the annotation maker
            var makeAnnotationsRelationship = d3.annotation()
                // .editMode(true)
                .type(d3.annotationLabel)
                .annotations(annotations_relationship);
            annotation_relation_group.call(makeAnnotationsRelationship);

            //Update a few stylings
            annotation_relation_group.selectAll(".note-line, .connector")
                .style("stroke", "none");
            annotation_relation_group.select(".annotation-note-title")
                .style("fill", color_relation(d.type) === "#bbbbbb" ? "#9e9e9e" : color_relation(d.type));
            
        }//function mouse_over_relation

        ///////////////////////////////////////////////////////////////////////////
        //////////////////////// Create cover chapter circle //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Add a circle at the center that will show the cover image on hover
        var cover_circle_group = chart.append("g").attr("class", "cover-circle-group");
        var cover_circle = cover_circle_group.append("circle")
            .attr("class", "cover-circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", rad_image)
            .style("fill", "none");

        ///////////////////////////////////////////////////////////////////////////
        ////////////////////// Create hidden name hover areas /////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var arc_character_hover = d3.arc()
            .outerRadius(function(d,i) { return character_total_data[i].dot_name_rad + rad_hover_circle; })
            .innerRadius(rad_donut_inner)

        //Create the donut slices per character (and the number of chapters they appeared in)
        var character_hover_group = chart.append("g").attr("class", "character-hover-group");
        var character_hover = character_hover_group.selectAll(".character-hover-arc")
            .data(arcs)
            .enter().append("path")
            .attr("class", "character-hover-arc")
            .attr("d", arc_character_hover)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", mouse_over_character)
            .on("mouseout", mouse_out);

        function mouse_over_character(d) {
            d3.event.stopPropagation();
            mouse_over_in_action = true;

            //Show the chosen lines
            ctx.clearRect(-width/2, -height/2, width, height);
            ctx.globalAlpha = 0.8;
            create_lines("character", character_data.filter(function(c,j) {return c.character === d.character; }) );

            //Update label path
            line_label_path.attr("d", label_arc(characterByName[d.character].name_angle));
            //Update the label text
            clearTimeout(remove_text_timer);
            var label_words = d.character === "Classmates" ? "Naoko, Chiharu, Rika and/or Yamazaki appear" : d.character === "Nakuru" ? "Ruby Moon (also known as Nakuru) appears" : d.character === "Spinel" ? "Spinel Sun appears" : d.character + " appears";
            line_label.text("chapters that " + label_words + " in");

            //Highlight the chapters this character appears in
            var char_chapters = character_data
                .filter(function(c) { return c.character === d.character; })
                .map(function(c) { return c.chapter; });
            var char_color = characterByName[d.character].color;
            chapter_hover_slice.filter(function(c,j) { return char_chapters.indexOf(j+1) >= 0; })
                .style("fill", char_color)
                .style("stroke", char_color);
            chapter_number.filter(function(c,j) { return char_chapters.indexOf(j+1) >= 0; })
                .style("fill", "white");
            chapter_dot.filter(function(c,j) { return char_chapters.indexOf(j+1) >= 0; })
                .attr("r", chapter_dot_rad * 1.5)
                .style("stroke-width", chapter_dot_rad * 0.5 * 1.5)
                .style("fill", char_color);

            //Show the character image in the center
            cover_image.attr("xlink:href", "img/character-" + d.character.toLowerCase() + ".jpg")
            cover_circle.style("fill", "url(#cover-image)");

            //Show the hover circle
            hover_circle.filter(function(c) { return d.character === c.character; })
                .style("opacity", 1);

        }//function mouse_over_character

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Create chapter donut chart //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Create groups in right order
        var chapter_group = chart.append("g").attr("class", "chapter-group");
        var donut_chapter_group = chapter_group.append("g").attr("class", "donut-chapter-group");
        var chapter_dot_group = chapter_group.append("g").attr("class", "chapter-dot-group");
        var donut_chapter_hover_group = chapter_group.append("g").attr("class", "donut-chapter_hover-group");
        var chapter_num_group = chapter_group.append("g").attr("class", "chapter-number-group");

        //Arc command for the chapter number donut chart
        var arc_chapter = d3.arc()
            .outerRadius(rad_chapter_donut_outer)
            .innerRadius(rad_chapter_donut_inner)
            .padAngle(0.01)
            .cornerRadius((rad_chapter_donut_outer - rad_chapter_donut_inner) / 2)

        //Create the donut slices per character (and the number of chapters they appeared in)
        var chapter_slice = donut_chapter_group.selectAll(".arc")
            .data(chapter_location_data)
            .enter().append("path")
            .attr("class", "arc")
            .attr("d", arc_chapter)
            .style("fill", "none")
            .style("stroke", "#c4c4c4")
            .style("stroke-width", 1 * size_factor);
        //Create the donut slices per character (and the number of chapters they appeared in)
        var chapter_hover_slice = donut_chapter_hover_group.selectAll(".arc")
            .data(chapter_location_data)
            .enter().append("path")
            .attr("class", "arc")
            .attr("d", arc_chapter)
            .style("fill", "none")
            .style("stroke", "none")
            .style("stroke-width", 1.5 * size_factor);

        //The text is placed in the center of each donut slice
        var rad_chapter_donut_half = ((rad_chapter_donut_outer - rad_chapter_donut_inner) / 2 + rad_chapter_donut_inner);
                
        //Add chapter number text
        var chapter_number = chapter_num_group.selectAll(".chapter-number")
            .data(chapter_location_data)
            .enter().append("text")
            .attr("class", "chapter-number")
            .style("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("transform", function (d, i) {
                var angle = d.centerAngle * 180 / Math.PI - 90;
                return "rotate(" + angle + ")translate(" + rad_chapter_donut_half + ")" +
                    // (d.centerAngle > 0 & d.centerAngle < Math.PI ? "" : "rotate(180)")
                    "rotate(" + -angle + ")";
            })
            .style("font-size", (9*size_factor) + "px")
            .text(function (d, i) { return i + 1; });

        //Add a circle at the inside of each chapter slice
        var chapter_dot_rad = 3.5 * size_factor;
        var chapter_dot = chapter_dot_group.selectAll(".chapter-dot")
            .data(chapter_location_data)
            .enter().append("circle")
            .attr("class", "chapter-dot")
            .attr("cx", function (d) { return rad_dot_color * Math.cos(d.centerAngle - pi1_2); })
            .attr("cy", function (d) { return rad_dot_color * Math.sin(d.centerAngle - pi1_2); })
            .attr("r", chapter_dot_rad)
            .style("fill", "#c4c4c4")
            .style("stroke", "white")
            .style("stroke-width", chapter_dot_rad * 0.5);

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Create volume dotted line ///////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Create groups in right order
        var donut_volume_group = chart.append("g").attr("class", "donut-volume-group");

        //Create the arcs data
        var volume_data = [
            { volume: 1, num_chapters: 5, chapter_start: 1, chapter_end: 5 },
            { volume: 2, num_chapters: 5, chapter_start: 6, chapter_end: 10 },
            { volume: 4, num_chapters: 4, chapter_start: 11, chapter_end: 14 },
            { volume: 3, num_chapters: 4, chapter_start: 15, chapter_end: 18 },
            { volume: 5, num_chapters: 4, chapter_start: 19, chapter_end: 22 },
            { volume: 6, num_chapters: 4, chapter_start: 23, chapter_end: 26 },
            { volume: 7, num_chapters: 4, chapter_start: 27, chapter_end: 30 },
            { volume: 8, num_chapters: 4, chapter_start: 31, chapter_end: 34 },
            { volume: 9, num_chapters: 4, chapter_start: 35, chapter_end: 38 },
            { volume: 10, num_chapters: 4, chapter_start: 39, chapter_end: 42 },
            { volume: 11, num_chapters: 3, chapter_start: 43, chapter_end: 45 },
            { volume: 12, num_chapters: 5, chapter_start: 46, chapter_end: 50 }
        ];
        volume_data = volume_data.filter(function(d) { return d.volume <= num_volume; });
        //Figure out the start and end angle
        volume_data.forEach(function (d, i) {
            d.startAngle = chapter_location_data[d.chapter_start - 1].startAngle,
            d.endAngle = chapter_location_data[d.chapter_end - 1].endAngle;
            d.centerAngle = (d.endAngle - d.startAngle) / 2 + d.startAngle;
        });

        var volume_slice = donut_volume_group.selectAll(".volume-arc")
            .data(volume_data)
            .enter().append("path")
            .attr("class", "volume-arc")
            .style("stroke", "#c4c4c4")
            .style("stroke", function(d,i) { return d.volume <= 6 ? color_kero : color_sakura; })
            .style("stroke-width", 3 * size_factor)
            .style("stroke-dasharray", "0," + (7 * size_factor))
            .attr("d", function(d,i) {
                var rad = rad_volume_inner,
                    xs = rad * Math.cos(d.startAngle - pi1_2),
                    ys = rad * Math.sin(d.startAngle - pi1_2),
                    xt = rad * Math.cos(d.endAngle - pi1_2),
                    yt = rad * Math.sin(d.endAngle - pi1_2)
                return "M" + xs + "," + ys + " A" + rad + "," + rad + " 0 0 1 " + xt + "," + yt;
            });

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////// Create hidden chapter hover areas ///////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var arc_chapter_hover = d3.arc()
            .outerRadius(rad_chapter_outer)
            .innerRadius(rad_chapter_inner);

        //Create the donut slices per chapter
        var chapter_hover_group = chart.append("g").attr("class", "chapter-hover-group");
        var chapter_hover = chapter_hover_group.selectAll(".chapter-hover-arc")
            .data(chapter_location_data)
            .enter().append("path")
            .attr("class", "chapter-hover-arc")
            .attr("d", arc_chapter_hover)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", mouse_over_chapter)
            .on("mouseout", mouse_out);

        //When you mouse over a chapter arc
        function mouse_over_chapter(d,i) {
            d3.event.stopPropagation();
            mouse_over_in_action = true;

            ctx.clearRect(-width / 2, -height / 2, width, height);
            ctx.lineWidth = 4 * size_factor;
            ctx.globalAlpha = 1;
            create_lines("chapter", character_data.filter(function (c) { return c.chapter === i+1; }));
            
            //Update label path
            line_label_path.attr("d", label_arc(d.centerAngle));
            //Update the label text
            clearTimeout(remove_text_timer);
            line_label.text("characters that appear in chapter " + (i+1) );

            //Highlight the characters that appear in this chapter
            var char_chapters = character_data
                .filter(function(c) { return c.chapter === i+1; })
                .map(function(c) { return c.character; });

            names.filter(function(c) { return char_chapters.indexOf(c.character) < 0; })
                .style("opacity", 0.2);
            name_dot.filter(function(c) { return char_chapters.indexOf(c.character) < 0; })
                .style("opacity", 0.2);

            //Highlight the chapter donut slice
            chapter_hover_slice.filter(function (c, j) { return i === j; })
                .style("fill", color_sakura)
                .style("stroke", color_sakura);
            chapter_number.filter(function (c, j) { return i === j; })
                .style("fill", "white");
            chapter_dot.filter(function (c, j) { return i === j; })
                .attr("r", chapter_dot_rad * 1.5)
                .style("stroke-width", chapter_dot_rad * 0.5 * 1.5)
                .style("fill", color_sakura);

            //Show the cover image in the center
            cover_image.attr("xlink:href", "img/ccs-chapter-" + (i+1) + ".jpg")
            cover_circle.style("fill", "url(#cover-image)");
        }//function mouse_over_chapter

        //////////////////////////////////////////////////////////////
        ///////////////////// Create CMYK patterns ///////////////////
        //////////////////////////////////////////////////////////////

        //Patterns based on http://blockbuilder.org/veltman/50a350e86de82278ffb2df248499d3e2
        var radius_color_max = 2 * size_factor;
        var radius_color = d3.scaleSqrt().range([0, radius_color_max]);

        var ccs_colors = color_data.map(function (d) { return d.color; }),
            cmyk_colors = ["yellow", "magenta", "cyan", "black"],
            rotation = [0, -15, 15, 45];

        //Loop over the different colors in the palette
        for (var j = 0; j < ccs_colors.length; j++) {
            //Get the radius transformations for this color
            var CMYK = rgbToCMYK(d3.rgb(ccs_colors[j]));

            //Create 4 patterns, C-Y-M-K, together forming the color
            defs.selectAll(".pattern-sub")
                .data(cmyk_colors)
                .enter().append("pattern")
                .attr("id", function (d) { return "pattern-sub-" + d + "-" + j; })
                .attr("patternUnits", "userSpaceOnUse")
                .attr("patternTransform", function (d, i) { return "rotate(" + rotation[i] + ")"; })
                .attr("width", 2 * radius_color_max)
                .attr("height", 2 * radius_color_max)
                .append("circle")
                .attr("fill", Object)
                .attr("cx", radius_color_max)
                .attr("cy", radius_color_max)
                .attr("r", function (d) { return Math.max(0.001, radius_color(CMYK[d])); });

            //Nest the CMYK patterns into a larger pattern
            var patterns = defs.append("pattern")
                .attr("id", "pattern-total-" + j)
                .attr("patternUnits", "userSpaceOnUse")
                .attr("width", radius_color_max * 31)
                .attr("height", radius_color_max * 31)

            //Append white background
            patterns.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("x", 0)
                .attr("y", 0)
                .style("fill","white")

            //Add the CMYK patterns
            patterns
                .selectAll(".dots")
                .data(cmyk_colors)
                .enter().append("rect")
                .attr("class", "dots")
                .attr("width", width)
                .attr("height", height)
                .attr("x", 0)
                .attr("y", 0)
                .style("mix-blend-mode", "multiply")
                .attr("fill", function (d, i) { return "url(#pattern-sub-" + cmyk_colors[i] + "-" + j + ")"; })
        }//for j

        ///////////////////////////////////////////////////////////////////////////
        /////////////////////////// Create color circles //////////////////////////
        ///////////////////////////////////////////////////////////////////////////    
        //The colored circles right after the character names
        var color_group = chart.append("g").attr("class", "color-group");
        var color_circle = color_group.selectAll(".color-circle")
            .data(color_data)
            .enter().append("circle")
            .attr("class", "color-circle")
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            .attr("r", function (d) { return d.radius * size_factor; })
            .style("fill", function (d) { return d.color; })
            .style("stroke", function (d) { return d.color; })
            .style("stroke-width", 3 * size_factor)
            // .call(d3.drag()
            //     .on('start', dragstarted)
            //     .on('drag', dragged)
            //     .on('end', dragended)
            // );

        ///////////////////////////////////////////////////////////////////////////
        //////////////////////// Create hover color circle ////////////////////////
        ///////////////////////////////////////////////////////////////////////////  

        //The stroked circle around the color circles that appears on a hover
        var color_circle_hover_group = chart.append("g").attr("class", "color-circle-hover-group");
        var color_hover_circle = color_circle_hover_group
            // .selectAll(".color-hover-circle")
            // .data(chapter_location_data)
            // .enter()
            .append("circle")
            .attr("class", "color-hover-circle")
            // .attr("cx", function (d) { return rad_color * Math.cos(d.centerAngle - pi1_2); })
            // .attr("cy", function (d) { return rad_color * Math.sin(d.centerAngle - pi1_2); })
            .attr("r",  36 * size_factor)
            .style("fill", "none")
            .style("stroke", color_sakura)
            .style("stroke-width", chapter_dot_rad * 0.5 * 1.5)
            .style("opacity", 0);

        ///////////////////////////////////////////////////////////////////////////
        ////////////////////// Create hidden cover hover areas ////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var arc_cover_hover = d3.arc()
            .outerRadius(rad_cover_outer)
            .innerRadius(rad_cover_inner);

        //Create the donut slices per chapter
        var cover_hover_group = chart.append("g").attr("class", "cover-hover-group");
        var cover_hover = cover_hover_group.selectAll(".cover-hover-arc")
            .data(chapter_location_data)
            .enter().append("path")
            .attr("class", "cover-hover-arc")
            .attr("d", arc_cover_hover)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", mouse_over_cover)
            .on("mouseout", mouse_out);

        //When you mouse over a chapter arc
        function mouse_over_cover(d,i) {
            d3.event.stopPropagation();
            mouse_over_in_action = true;

            ctx.clearRect(-width / 2, -height / 2, width, height);
            ctx.lineWidth = 4 * size_factor;
            ctx.globalAlpha = 1;
            create_lines("character", cover_data.filter(function (c) { return c.chapter === i+1; }));
            
            //Update label path
            line_label_path.attr("d", label_arc(d.centerAngle));
            //Update the label text
            clearTimeout(remove_text_timer);
            line_label.text("characters that appear on the cover of chapter " + (i+1) );

            //Highlight the characters that appear in this chapter
            var char_chapters = cover_data
                .filter(function(c) { return c.chapter === i+1; })
                .map(function(c) { return c.character; });

            names.filter(function(c) { return char_chapters.indexOf(c.character) < 0; })
                .style("opacity", 0.2);
            name_dot.filter(function(c) { return char_chapters.indexOf(c.character) < 0; })
                .style("opacity", 0.2);

            //Highlight the chapter donut slice
            chapter_hover_slice.filter(function (c, j) { return i === j; })
                .style("stroke-width", chapter_dot_rad * 0.5 * 1.5)
                .style("stroke", color_sakura);
            chapter_dot.filter(function (c, j) { return i === j; })
                .attr("r", chapter_dot_rad * 1.5)
                .style("stroke-width", chapter_dot_rad * 0.5 * 1.5)
                .style("fill", color_sakura);

            //Show the cover image in the center
            cover_image.attr("xlink:href", "img/ccs-chapter-" + (i+1) + ".jpg")
            cover_circle.style("fill", "url(#cover-image)");

            //Show the circle around the color chapter group
            color_hover_circle
                .attr("cx", rad_color * Math.cos(d.centerAngle - pi1_2))
                .attr("cy", rad_color * Math.sin(d.centerAngle - pi1_2))
                .style("opacity", 1);
        }//function mouse_over_cover

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// General mouse out function //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        container.on("mouseout", mouse_out);

        //When you mouse out of a chapter or character
        function mouse_out() {
            //Only run this if there was a mouseover before
            if(!mouse_over_in_action) return;
            mouse_over_in_action = false;

            ctx.clearRect(-width / 2, -height / 2, width, height);
            ctx.globalAlpha = cover_alpha;
            create_lines("character", cover_data);

            //Update the label text
            line_label.text(default_label_text)
            remove_text_timer = setTimeout(function() { line_label.text("")}, 6000);

            //Character names back to normal
            names.style("opacity", null);
            name_dot.style("opacity", null);

            //Character names back to normal
            names.style("opacity", null);
            name_dot.style("opacity", null);

            //Chapter donut back to normal
            chapter_hover_slice.style("fill", "none").style("stroke", "none");
            chapter_number.style("fill", null);
            chapter_dot
                .attr("r", chapter_dot_rad)
                .style("stroke-width", chapter_dot_rad * 0.5)
                .style("fill", "#c4c4c4");

            //Remove cover image
            cover_circle.style("fill", "none");
            cover_image.attr("xlink:href", "img/white-square.jpg");

            //Hide the hover circle
            hover_circle.style("opacity", 0);
            //Hide the circle around the color chapter group
            color_hover_circle.style("opacity", 0);

            //Bring all relationships back
            relation_lines.style("opacity", 0.7);
            //Remove relationship annotation
            annotation_relation_group.selectAll(".annotation").remove();
        }//function mouse_out

        ///////////////////////////////////////////////////////////////////////////
        //////////////////////// Create captured card labels //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var card_group = chart.append("g").attr("class", "card-group");

        //Create a group per character
        var card_label = card_group.selectAll(".card-label")
            .data(chapter_total_data)
            .enter().append("text")
            .attr("class", "card-label")
            .attr("dy", ".35em")
            .each(function(d,i) {
                d.centerAngle = chapter_location_data[d.chapter-1].centerAngle;
            })
            .attr("transform", function (d, i) {
                return "rotate(" + (d.centerAngle * 180 / Math.PI - 90) + ")"
                    + "translate(" + rad_card_label + ")"
                    + (d.centerAngle > 0 & d.centerAngle < Math.PI ? "" : "rotate(180)");
            })
            .style("text-anchor", function (d) { return d.centerAngle > 0 & d.centerAngle < Math.PI ? "start" : "end"; })
            .style("font-size", (10 * size_factor) + "px")
            .text(function (d, i) { return d.card_captured; });

        //////////////////////////////////////////////////////////////
        ///////////////// Create annotation gradients ////////////////
        //////////////////////////////////////////////////////////////

        //Gradient for the titles of the annotations
        var grad = defs.append("linearGradient")
            .attr("id", "gradient-title")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "0%");
        grad.append("stop")
            .attr("offset", "50%")   
            .attr("stop-color", color_sakura);
        grad.append("stop")
            .attr("offset", "200%")   
            .attr("stop-color", "#ED8B6A");

        //Gradient for the titles of the annotations
        var grad = defs.append("linearGradient")
            .attr("id", "gradient-title-legend")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "0%");
        grad.append("stop")
            .attr("offset", "50%")   
            .attr("stop-color", color_syaoran);
        grad.append("stop")
            .attr("offset", "200%")   
            .attr("stop-color", "#9ABF2B");
        
        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Create annotations //////////////////////////
        ///////////////////////////////////////////////////////////////////////////

        //Only create annotations when the screen is big enough
        if(!width_too_small) {

            var annotations = [
                {
                    note: {
                        label: "Around the right half of the large circle you can see in which chapter the Clow cards were captured. Sakura was already in possession of Windy and Wood at the start of chapter 1",
                        title: "Clow Cards",
                        wrap: 270*size_factor,
                    },
                    chapter: 1,
                    extra_rad: 24 * size_factor,
                    className: "note-right note-legend",
                    x: 151 * size_factor,
                    y: -705 * size_factor,
                    cx: 55 * size_factor,
                    cy: -686 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "These circles reveal the main colors present in each chapter's cover art. The size of each circle represents the percentage of the cover image that is captured in that color. All circles from one chapter add up to 100%",
                        title: "Cover art",
                        wrap: 270*size_factor,
                    },
                    chapter: 1,
                    extra_rad: 55 * size_factor,
                    className: "note-right note-legend",
                    x: 532 * size_factor,
                    y: -532 * size_factor,
                    cx: 412 * size_factor,
                    cy: -493 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "With the 10 captured cards, Kero teaches Sakura how to do a fortune-telling to get insight into which card is running around town looking like Sakura",
                        title: "Fortune-telling",
                        wrap: 205*size_factor,
                    },
                    chapter: 11,
                    extra_rad: 30 * size_factor,
                    className: "note-right note-story",
                    x: 745 * size_factor,
                    y: -115 * size_factor,
                    cx: 612 * size_factor,
                    cy: -161 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Sakura, Tomoyo and Syaoran are stuck in a maze, when Kaho appears and breaks the walls with her 'Moon Bell', guiding the group to the exit",
                        title: "Kaho's Bell",
                        wrap: 190*size_factor,
                        padding: 10*size_factor
                    },
                    chapter: 15,
                    extra_rad: 22 * size_factor,
                    className: "note-right note-story",
                    x: 774 * size_factor,
                    y: 240 * size_factor,
                    cx: 657 * size_factor,
                    cy: 170 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "This chapter is mostly Sakura and Syaoran during their school trip at the beach. While on an evening event in a cave everybody else starts to disappear",
                        title: "Ghost stories",
                        wrap: 200*size_factor,
                        padding: 10*size_factor
                    },
                    chapter: 17,
                    extra_rad: 30 * size_factor,
                    className: "note-right note-story",
                    x: 736 * size_factor,
                    y: 407 * size_factor,
                    cx: 607 * size_factor,
                    cy: 323 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Kero can finally return to his full form after Sakura catches the Firey card",
                        title: "Cerberus",
                        wrap: 180*size_factor,
                        padding: 10*size_factor
                    },
                    chapter: 23,
                    extra_rad: 30 * size_factor,
                    className: "note-right note-story",
                    x: 256 * size_factor,
                    y: 780 * size_factor,
                    cx: 210 * size_factor,
                    cy: 650 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "After the capture of all 19 cards, Yue holds 'the final trial'. Eventually, he accepts Sakura as the new mistress of the Clow Cards",
                        title: "The final judge",
                        wrap: 220*size_factor,
                        padding: 10*size_factor
                    },
                    chapter: 26,
                    extra_rad: 60 * size_factor,
                    className: "note-right note-story",
                    x: -10 * size_factor,
                    y: 812 * size_factor,
                    cx: -26 * size_factor,
                    cy: 634 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Around the left half of the large circle you can see in which chapter the Clow cards were converted to Sakura cards",
                        title: "Sakura Cards",
                        wrap: 200*size_factor,
                        padding: 10*size_factor
                    },
                    chapter: 29,
                    extra_rad: 25 * size_factor,
                    className: "note-left note-legend",
                    x: -291 * size_factor,
                    y: 764 * size_factor,
                    cx: -287 * size_factor,
                    cy: 624 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Syaoran finally understands that it's Sakura that he loves, not Yukito",
                        title: "First love",
                        wrap: 170*size_factor,
                        padding: 10*size_factor
                    },
                    chapter: 31,
                    extra_rad: 92 * size_factor,
                    className: "note-left note-story",
                    x: -460 * size_factor,
                    y: 655 * size_factor,
                    cx: -406 * size_factor,
                    cy: 485 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "The Fly transforms to give Sakura herself wings to fly, instead of her staff",
                        title: "Fly",
                        wrap: 230*size_factor,
                    },
                    chapter: 32,
                    extra_rad: 27 * size_factor,
                    className: "note-left note-story",
                    x: -598 * size_factor,
                    y: 556 * size_factor,
                    cx: -515 * size_factor,
                    cy: 485 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Toya gives his magical powers to Yue (and thus also Yukito) to keep them from disappearing because Sakura doesn't yet have enough magic herself to sustain them",
                        title: "Toya's gift",
                        wrap: 180*size_factor,
                        padding: 10*size_factor
                    },
                    chapter: 38,
                    extra_rad: 50 * size_factor,
                    className: "note-left note-story",
                    x: -785 * size_factor,
                    y: 148 * size_factor,
                    cx: -700 * size_factor,
                    cy: 12 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Sakura and Syaoran use their magic together to defeat Eriol's bronze horse",
                        title: "Teamwork",
                        wrap: 200*size_factor,
                    },
                    chapter: 42,
                    extra_rad: 30 * size_factor,
                    className: "note-left note-story",
                    x: -735 * size_factor,
                    y: -366 * size_factor,
                    cx: -695 * size_factor,
                    cy: -370 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Sakura 'defeats' Eriol and has now transformed all the Clow cards into Sakura cards",
                        title: "The strongest magician",
                        wrap: 270*size_factor,
                    },
                    chapter: 44,
                    extra_rad: 30 * size_factor,
                    className: "note-left note-story",
                    x: -596 * size_factor,
                    y: -577 * size_factor,
                    cx: -593 * size_factor,
                    cy: -560 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                },{
                    note: {
                        label: "Sakura realizes she loves Syaoran the most, right before he leaves for the airport to move back home to Hong Kong",
                        title: "True love",
                        wrap: 240*size_factor,
                    },
                    chapter: 50,
                    extra_rad: 30 * size_factor,
                    className: "note-left note-story",
                    x: -125 * size_factor,
                    y: -660 * size_factor,
                    cx: -48 * size_factor,
                    cy: -633 * size_factor,
                    dx: 5 * size_factor,
                    dy: -5 * size_factor
                }
            ];

            //Set-up the annotation maker
            var makeAnnotations = d3.annotation()
                //.editMode(true)
                .type(d3.annotationLabel)
                .annotations(annotations);

            //Call and create the textual part of the annotations
            var annotation_group = chart.append("g").attr("class", "annotation-group");
            annotation_group.call(makeAnnotations);
        
            //Update a few stylings
            annotation_group.selectAll(".note-line, .connector")
                .style("stroke", "none");
            annotation_group.selectAll(".annotation-note-title")
                .style("fill", "url(#gradient-title)");

            //Create my own radially pointing connector lines
            var annotation_connector_group = annotation_group.append("g", "annotation-connectors");
            annotations.forEach(function(d,i) {
                var angle = Math.atan(d.cy/d.cx);
                if(d.cx < 0) angle = -Math.atan(d.cy/-d.cx) + Math.PI;
                annotation_connector_group.append("line")
                    .attr("class", "connector-manual " + d.className)
                    .attr("x1", d.cx)
                    .attr("y1", d.cy)
                    .attr("x2", d.cx + d.extra_rad * Math.cos(angle) )
                    .attr("y2", d.cy + d.extra_rad * Math.sin(angle) )
                    .style("stroke-width", 2 * size_factor)
                    .style("stroke-linecap", "round")
                    .style("stroke", color_sakura);
            });

            //Turn the legend based annotations green
            annotation_group.selectAll(".note-legend .annotation-note-title")
                .style("fill", "url(#gradient-title-legend)");
            annotation_connector_group.selectAll(".note-legend")
                .style("stroke", color_syaoran);

            //Add circles to the legend annotations
            var annotation_circle_group = annotation_group.append("g", "annotation-circles");
            //Add circle to first clow card                       
            annotation_circle_group.append("circle")
                .attr("class", "annotation-circle")
                .attr("cx", 50 * size_factor)
                .attr("cy", -655 * size_factor)
                .attr("r", 25 * size_factor);

            //Add circle to cover art annotation
            annotation_circle_group.append("circle")
                .attr("class", "annotation-circle")
                .attr("cx", rad_color * Math.cos(chapter_location_data[5].centerAngle - pi1_2))
                .attr("cy", rad_color * Math.sin(chapter_location_data[5].centerAngle - pi1_2))
                .attr("r", 38 * size_factor);
            
            //Add circle to first sakura card                       
            annotation_circle_group.append("circle")
                .attr("class", "annotation-circle")
                .attr("cx", -273 * size_factor)
                .attr("cy", 596 * size_factor)
                .attr("r", 25 * size_factor);

            annotation_circle_group.selectAll(".annotation-circle")
                .style("stroke-dasharray", "0," + (6 * size_factor))
                .style("stroke-width", 2.5 * size_factor)
                .style("stroke", color_syaoran);

            //Make it possible to show/hide the annotations
            var show_annotations = true;
            d3.select("#story-annotation")
                .style("opacity", 1)
                .on("click", spoiler_click);

            function spoiler_click() {
                show_annotations = !show_annotations;
                annotation_group.selectAll(".note-story")
                    .style("opacity", show_annotations ? 1 : 0);
                d3.select("#hide-show").html(show_annotations ? "hide" : "show");
            }//function spoiler_click

        } else {
            //Hide the annotation mentions in the intro
            d3.select("#annotation-explanation").style("display","none");
        }//else

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Create line title label /////////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var line_label_group = chart.append("g").attr("class", "line-label-group");

        //Define the arc on which to draw the label text
        function label_arc(angle) {
            var x1 = rad_line_label * Math.cos(angle + 0.01 - pi1_2),
                y1 = rad_line_label * Math.sin(angle + 0.01 - pi1_2);
            var x2 = rad_line_label * Math.cos(angle - 0.01 - pi1_2),
                y2 = rad_line_label * Math.sin(angle - 0.01 - pi1_2);
            if (angle / Math.PI > 0.5 && angle / Math.PI < 1.5) {
                return "M" + x1 + "," + y1 + " A" + rad_line_label + "," + rad_line_label + " 0 1 1 " + x2 + "," + y2;
            } else {
                return "M" + x2 + "," + y2 + " A" + rad_line_label + "," + rad_line_label + " 0 1 0 " + x1 + "," + y1;
            }//else
        }//function label_arc

        //Create the paths along which the pillar labels will run
        var line_label_path = line_label_group.append("path")
            .attr("class", "line-label-path")
            .attr("id", "line-label-path")
            .attr("d", label_arc(characterByName["Sakura"].name_angle))
            .style("fill", "none")
            .style("display", "none");

        //Create the label text
        var default_label_text = "currently, these lines show which characters appear on the chapter's cover art";
        var line_label = line_label_group.append("text")
            .attr("class", "line-label")
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .style("font-size", (14 * size_factor) + "px")
            .append("textPath")
            .attr("xlink:href", "#line-label-path")
            .attr("startOffset", "50%")
            .text(default_label_text);

        ///////////////////////////////////////////////////////////////////////////
        //////////////////// Create character & chapter lines /////////////////////
        /////////////////////////////////////////////////////////////////////////// 
        
        //Line function to draw the lines from character to chapter on canvas
        var line = d3.lineRadial()
            .angle(function(d) { return d.angle; })
            .radius(function(d) { return d.radius; })
            .curve(d3.curveBasis)
            .context(ctx);
            
        //Draw the lines for the cover
        ctx.globalAlpha = cover_alpha;
        create_lines("character", cover_data);

        function create_lines(type, data) {

            for (var i = 0; i < data.length; i++) {
                d = data[i];
                var line_data = [];

                var source_a = characterByName[d.character].name_angle,
                    source_r = characterByName[d.character].dot_name_rad
                var target_a = chapter_location_data[d.chapter - 1].centerAngle,
                    target_r = rad_dot_color;

                //Figure out some variable that will determine the path points to create
                if (target_a - source_a < -Math.PI) {
                    var side = "cw";
                    var da = 2 + (target_a - source_a) / Math.PI;
                    var angle_sign = 1;
                } else if (target_a - source_a < 0) {
                    var side = "ccw";
                    var da = (source_a - target_a) / Math.PI;
                    var angle_sign = -1;
                } else if (target_a - source_a < Math.PI) {
                    var side = "cw";
                    var da = (target_a - source_a) / Math.PI;
                    var angle_sign = 1;
                } else {
                    var side = "ccw";
                    var da = 2 - (target_a - source_a) / Math.PI;
                    var angle_sign = -1;
                }//else
                //console.log(side, da, angle_sign);


                //Calculate the radius of the middle arcing section of the line
                var range = type === "character" ? [rad_line_max, rad_line_min] : [rad_line_min, rad_line_max];
                var scale_rad_curve = d3.scaleLinear()
                    .domain([0, 1])
                    .range(range);
                var rad_curve_line = scale_rad_curve(da) * width;

                //Slightly offset the first point on the curve from the source
                var range = type === "character" ? [0, 0.07] : [0, 0.01];
                var scale_angle_start_offset = d3.scaleLinear()
                    .domain([0, 1])
                    .range(range);
                var start_angle = source_a + angle_sign * scale_angle_start_offset(da) * Math.PI;

                //Slightly offset the last point on the curve from the target
                var range = type === "character" ? [0, 0.02] : [0, 0.07];
                var scale_angle_end_offset = d3.scaleLinear()
                    .domain([0, 1])
                    .range(range);
                var end_angle = target_a - angle_sign * scale_angle_end_offset(da) * Math.PI;

                if (target_a - source_a < -Math.PI) {
                    var da_inner = pi2 + (end_angle - start_angle);
                } else if (target_a - source_a < 0) {
                    var da_inner = (start_angle - end_angle);
                } else if (target_a - source_a < Math.PI) {
                    var da_inner = (end_angle - start_angle);
                } else if (target_a - source_a < 2 * Math.PI) {
                    var da_inner = pi2 - (end_angle - start_angle)
                }//else if

                //Attach first point to data
                line_data.push({
                    angle: source_a,
                    radius: source_r
                });

                //Attach first point of the curve section
                line_data.push({
                    angle: start_angle,
                    radius: rad_curve_line
                });

                //Create points in between for the curve line
                var step = 0.06;
                var n = Math.abs(Math.floor(da_inner / step));
                var curve_angle = start_angle;
                var sign = side === "cw" ? 1 : -1;
                if(n >= 1) {
                    for (var j = 0; j < n; j++) {
                        curve_angle += (sign * step) % pi2; 
                        line_data.push({
                            angle: curve_angle,
                            radius: rad_curve_line
                        });
                    }//for j
                }//if

                //Attach last point of the curve section
                line_data.push({
                    angle: end_angle,
                    radius: rad_curve_line
                });

                //Attach last point to data
                line_data.push({
                    angle: target_a,
                    radius: target_r
                });

                //Draw the path
                ctx.beginPath();
                line(line_data);
                ctx.strokeStyle = characterByName[d.character].color;
                ctx.stroke(); 

            }//for

            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 3 * size_factor;

        }//function create_lines

    }//function draw

    // Retina non-blurry canvas
    function crispyCanvas(canvas, ctx, sf) {
        canvas
            .attr('width', sf * width)
            .attr('height', sf * height)
            .style('width', width + "px")
            .style('height', height + "px");
        ctx.scale(sf, sf);
    }//function crispyCanvas

    // //Dragging functions for final positioning adjustments
    // function dragstarted(d) {
    //     if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    //     d.fx = d.x;
    //     d.fy = d.y;
    // }//function dragstarted

    // function dragged(d) {
    //     d.fx = d3.event.x;
    //     d.fy = d3.event.y;
    // }//function dragged

    // function dragended(d) {
    //     if (!d3.event.active) simulation.alphaTarget(0);
    //     d.fx = null;
    //     d.fy = null;
    // }//function dragended

}//function create_CCS_chart

//////////////////////////////////////////////////////////////
////////////////////// Helper functions //////////////////////
//////////////////////////////////////////////////////////////

//Turn RGB into CMYK "circle radii"
function rgbToCMYK(rgb) {
    var r = rgb.r / 255,
        g = rgb.g / 255,
        b = rgb.b / 255,
        k = 1 - Math.max(r, g, b);

    return {
        cyan: (1 - r - k) / (1 - k),
        magenta: (1 - g - k) / (1 - k),
        yellow: (1 - b - k) / (1 - k),
        black: k
    };
}//function rgbToCMYK

//Get a "random" number generator where you can fix the starting seed
//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
var seed = 4;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}//function random

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}//function capitalizeFirstLetter
