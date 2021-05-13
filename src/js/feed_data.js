
let dataset = [], info = [], ML_model;
const d = $.Deferred();
const rule_thres = 0.7;

var spinner = new Vue({ el: '#spinner' })
cnvSpinner.start('spinner', 'Loading');

async function tensorFlow(){
    ML_model = await tf.loadLayersModel('./src/vent-model-js-V2/model.json');
}

function showModal(id) {
    $('#myModal').modal('show');
    const pType = id.id.split(':')[0];
    const pId = id.id.split(':')[1];
    const pTime = id.id.split(':')[2];
    const data = dataset.filter(d => d.Id === pId && d.Date.slice(0,10)===pTime)[0];

    $("#modal-body").html(``);
    if(pType === 'profile'){
        $("#modal-header").html(`<h4 class="modal-title">${data.LAST+', '+data.FIRST}</h4>`);
        let innerHtml = '';
        innerHtml += `<p>Patient ID: ${data.ID}</p>`;
        innerHtml += `<p>First Name: ${data.FIRST}</p>`;
        innerHtml += `<p>Last Name: ${data.LAST}</p>`;
        innerHtml += `<p>Marital Status: ${data['Marital Status']}</p>`;
        innerHtml += `<p>Birth Date: ${data.BIRTHDATE}</p>`;
        innerHtml += `<p>Gender: ${data.GENDER}</p>`;
        innerHtml += `<p>SSN #: ${data.SSN}</p>`;
        innerHtml += `<p>Passport #: ${data.PASSPORT}</p>`;
        innerHtml += `<p>Drivers License #: ${data.DRIVERS}</p>`;
        innerHtml += `<p>Ethnicity: ${data.ETHNICITY}</p>`;
        innerHtml += `<p>Race: ${data.RACE}</p>`;
        innerHtml += `<p>Address: ${data.ADDRESS}</p>`;
        $("#modal-body").html(innerHtml);
    }
    if(pType === 'monitor'){
        $("#modal-header").html(`<h4 class="modal-title">${data.LAST+', '+data.FIRST}</h4>
        <h4 style="position:absolute; top:8px; right:20px;">Date: ${data.Date}, Time: ${data.Time}</h4>`);
        let innerHtml = `<div id="chart_left">`;
        innerHtml += `<p>Heart Rate (/min)</p><p><div class="vis_div" id="heart_vis"></div></p>`;
        innerHtml += `<p>PEEP Respiratory System (cm[H2O])</p><p><div class="vis_div" id="peep_vis"></div></p>`;
        innerHtml += `<p>Systolic Blood Pressure (mm[Hg])</p><p><div class="vis_div" id="sbp_vis"></div></p>`;
        innerHtml += `</div><div id="chart_right">`;
        innerHtml += `<p>Arterial pH</p><p><div class="vis_div" id="aph_vis"></div></p>`;
        innerHtml += `<p>Arterial O2 Saturation (%)</p><p><div class="vis_div" id="aos_vis"></div></p>`;
        innerHtml += `<p>Oxygen/Inspired gas setting Ventilator (FiO2, %)</p><p><div class="vis_div" id="fio2_vis"></div></p>`;
        innerHtml += `</div><div id="chart_low">`;
        innerHtml += `<hr>`;
        innerHtml += `<h4>Current Ventilator Status: ${+data['Oxygen/Inspired gas setting [Volume Fraction] Ventilator (%)'] ? '<b style="color:red">ON</b>' : '<b style="color:green">WEANED</b>'}</b></h4>`;
        innerHtml += `<hr>`;
        innerHtml += `<h4>Ventilator Weaning Recommendation: </h4><br/>
            <table id="recommendation" class="table table-striped table-bordered" style="width:100%">
                <thead>
                    <tr>
                        <th>Rule Based</th>
                        <th>Machine Learning</th>
                    </tr>
                </thead>
                <tbody id="tbody-recommendation">
                <tr>
                    <th id="tbody-recommendation-rule">n/a</th>
                    <th id="tbody-recommendation-ml">n/a</th>
                <tr>
                </tbody>
            </table>`;
        innerHtml += `</div>`;
        $("#modal-body").html(innerHtml);
        let rule = +data.rule_prediction; //getRulePercent(data);
        let ml = +data.ml_prediction; //getRulePercent(data);
        ml = ml > 0 ? ml : 0;
        drawToday();

        function drawToday(){
            drawVis('heart_vis', 60, 130, +data['Heart rate (/min)']);//
            drawVis('sbp_vis', 90, 180, +data['Systolic Blood Pressure (mm[Hg])']);//
            drawVis('aph_vis', 7.25, 7.45, +data['pH of Arterial blood ([pH])']);//
            drawVis('aos_vis', 92, 100, +data['Oxygen saturation in Arterial blood (%)']);//
            drawVis('fio2_vis', 0, 50, +data['Oxygen/Inspired gas setting [Volume Fraction] Ventilator (%)']);//
            drawVis('peep_vis', 12, 35, +data['PEEP Respiratory system (cmH20)']);//
        }

        if(+data['Oxygen/Inspired gas setting [Volume Fraction] Ventilator (%)']){
            if(rule > rule_thres) {
                $("#tbody-recommendation-rule").html((rule * 100).toFixed(2) + '%. Ready to SBT (Wean Ventilator)');
            } else {
                $("#tbody-recommendation-rule").html('Keep ('+(rule * 100).toFixed(2) + '%)');
            }
            if(ml > 60) {
                $("#tbody-recommendation-ml").html((ml).toFixed(2) + '%. Ready to SBT (Wean Ventilator)');
            } else if(ml > 20) {
                $("#tbody-recommendation-ml").html('Keep ('+(ml).toFixed(2) + '%), patient status is good');
            } else {
                $("#tbody-recommendation-ml").html('Keep ('+(ml).toFixed(2) + '%), patient status is bad');
            }
        } else {
            $("#tbody-recommendation-rule").html('Weaned Today');
            $("#tbody-recommendation-ml").html('Weaned Today');
        }
    }
}

function drawVis(id, min, max, value, notShow){
    d3.select('#'+id).selectAll('*').remove();
    const min_new = Math.min(min, value);
    const max_new = Math.max(max, value);
    const max_final = max_new+(max_new-min_new)/4;
    const min_final = min_new-(max_new-min_new)/4;
    const x = d3.scaleLinear()
                .domain([min_final, max_final])
                .range([50,400]);

    setTimeout(() => {
        let svg = d3.select('#'+id)
            .append("svg")
            .attr("height", 100)
            .attr("width", 500);
        
        svg.append("g")
            .attr("transform", "translate(0,50)") 
            .call(d3.axisBottom(x).tickSize(-5));

        svg.append('rect')
            .attr('x', x(min))
            .attr('y', 50-10)
            .attr('width', x(max)-x(min))
            .attr('height', 10)
            .attr('stroke', 'none')
            .attr('fill', '#f0ad4e')
            .attr('fill-opacity', 0.5);
        
        svg.append('rect')
            .attr('x', x(value)-2)
            .attr('y', 50-15)
            .attr('width', 4)
            .attr('height', 15)
            .attr('stroke', 'none')
            .attr('fill', '#333')
            .attr('fill-opacity', 1);

        svg.append('text')
            .attr('x', x(value))
            .attr('y', 50-16)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'ideographic')
            .attr('fill', '#333')
            .attr('font-size', 12)
            .attr('fill-opacity', 1)
            .text(value);
        if(!notShow){
            if(value && (value > max || value < min)){
                svg.append('circle')
                    .style("fill", "red")
                    .attr("r", 10)
                    .attr("cx", 430)
                    .attr("cy", 50-5);
                // return 0;
            } else {
                svg.append('circle')
                    .style("fill", "#00cc03")
                    .attr("r", 10)
                    .attr("cx", 430)
                    .attr("cy", 50-5);
                // return 1;
            } 
        }
    }, 100);
}

$.when (
    tensorFlow(),
    fetch('https://hapi.fhir.org/baseR4/Patient?_id=2049254,2049404,2051023,2051024,2051026,2051027,2051028,2051029,2051030,2051031,2051032,2051033,2051034,2051035,2051036,2051037,2051038,2051039,2051040,2051025&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2049254,2049404&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051023,2051024&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051026,2051027&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051028,2051029&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051030,2051031&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051032,2051033&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051034,2051035&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051036,2051037&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051038,2051039&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),
    fetch('https://hapi.fhir.org/baseR4/Observation?subject=2051040,2051025&_pretty=true&_count=500').then(response => response.json()).then(d.resolve()),

).done((_,arr_patient,arr1,arr2,arr3,arr4,arr5,arr6,arr7,arr8,arr9,arr10) => {

    arr_patient.entry.forEach(d=>{
        let this_patient = {};
        this_patient['ID'] = d.resource.id;
        this_patient['Communication'] = d.resource.communication.map(i=>i.language.text).join();
        this_patient['Synthea ID'] = findValue(d.resource.identifier,'synthea');
        this_patient['GENDER'] = d.resource.gender;
        this_patient['Medical Record Number'] = findValue(d.resource.identifier,'Record Number');
        this_patient['SSN'] = findValue(d.resource.identifier,'ssn');
        this_patient['DRIVERS'] = findValue(d.resource.identifier,'Driver');
        this_patient['PASSPORT'] = findValue(d.resource.identifier,'passport');
        this_patient['Marital Status'] = d.resource.maritalStatus.text;
        this_patient['PHONE'] = findValue(d.resource.telecom,'phone');
        this_patient['BIRTHDATE'] = d.resource.birthDate;
        this_patient['ADDRESS'] = findAddress(d.resource.address);
        this_patient['RACE'] = findValue(d.resource.extension,'race');
        this_patient['ETHNICITY'] = findValue(d.resource.extension,'ethnicity');
        this_patient['FIRST'] = d.resource.name[0].given[0];
        this_patient['LAST'] = d.resource.name[0].family;
        info.push(this_patient);
    });

    let arr_dataset = [].concat.apply([], [arr1.entry,arr2.entry,arr3.entry,arr4.entry,arr5.entry,arr6.entry,arr7.entry,arr8.entry,arr9.entry,arr10.entry])
    arr_dataset.forEach(d=>{
        let date = d.resource.effectiveDateTime.slice(0,10);
        if(date.includes('2020-02') || date.includes('2020-03')){
            let time = d.resource.effectiveDateTime.slice(11,19);
            let id = d.resource.subject.reference.split('/')[1];
            let haveData = false;
            for(let i=0;i<dataset.length;i++){
                if(dataset[i].Date === date && dataset[i].Id === id){// && dataset[i].Time === time){
                    haveData = true;
                    let key = d.resource.code.coding[0].display+' ('+d.resource.valueQuantity.unit+')';
                    let value = d.resource.valueQuantity.value;
                    dataset[i][key] = value;
                }
            }
            if(!haveData){
                let this_data = {};
                let date = d.resource.effectiveDateTime.slice(0,10);
                let id = d.resource.subject.reference.split('/')[1];
                let key = d.resource.code.coding[0].display+' ('+d.resource.valueQuantity.unit+')';
                let value = d.resource.valueQuantity.value;
                this_data.Date = date;
                this_data.Time = time;
                this_data.Id = id;
                this_data[key] = value;
                dataset.push(this_data);
            }
        }
    });

    let date_list = dataset.map(d => d.Date.slice(0,10));
    date_list = [...new Set(date_list)];
    date_list = date_list.sort();

    var dateOptions = {};
    date_list.forEach(d=>{
        dateOptions[d]=d;
    })
    $.each(dateOptions, function(val, text) {
        $('#dateDropdown').append( new Option(text,val) );
    });
    
    let today = '2020-03-14';
    $("#dateDropdown").val(today);
    $("#dateDropdown").change(function () {
        today = this.value;
        initVis(today);
    });
    // let i=0;
    // $('#refresh').click(()=>{
    //     i++
    //     if(i > date_list.length-1){
    //         alert('No future data available, date reset back to day#1');
    //         i=0;
    //     }
    //     cnvSpinner.start('spinner', 'Loading');
    //     initVis(date_list[i]);
    // })

    console.log(info)
    console.log(dataset)

    initVis(today);

    function initVis(today){
        
        // $('#today').html(today);
        let dataset_today = dataset.filter(d => d.Date.slice(0,10)===today);
        let infoset_today = info.filter(p => dataset_today.map(d=>d.Id).includes(p.ID));

        dataset_today.forEach(d=>{
            let key = d['Id'];
            info.forEach(p=>{
                if(p.ID === key){
                    Object.keys(p).forEach(k=>{
                        d[k] = p[k]; 
                    })
                }
            });
            const ML_arr = [+d['Heart rate (/min)'],
                            +d['Systolic Blood Pressure (mm[Hg])'],
                            +d['pH of Arterial blood ([pH])'],
                            +d['Oxygen saturation in Arterial blood (%)'],
                            +d['Oxygen/Inspired gas setting [Volume Fraction] Ventilator (%)'],
                            +d['PEEP Respiratory system (cmH20)']];
            const x= tf.tensor([ML_arr])
            const prediction = ML_model.predict(x).arraySync()[0];
            d.ml_prediction = -prediction[2];
            d.rule_prediction = getRulePercent(d);
        });

        let innerHtml = '';
        dataset_today.forEach(d=>{
            let ml_innerHtml = '';
            let ml = +d.ml_prediction;
            if(ml > 60) {
                ml_innerHtml = (ml).toFixed(2) + '%. Ready to SBT (Wean Ventilator)';
            } else if(ml > 20) {
                ml_innerHtml = 'Keep ('+(ml).toFixed(2) + '%), patient status is good';
            } else {
                ml_innerHtml = 'Keep ('+(ml).toFixed(2) + '%), patient status is bad';
            }

            innerHtml+='<tr>';
            innerHtml+=`<td><button type="button" id="profile:${d.Id+':'+today}" onclick="showModal(this)" >
            <img src="./src/open-iconic-master/svg/share-boxed.svg">
            </button> ${d.LAST+', '+d.FIRST}</td>`;
            innerHtml+=`<td>${d.BIRTHDATE}</td>`;
            innerHtml+=`<td><button type="button" id="monitor:${d.Id+':'+today}" onclick="showModal(this)" >
            <img src="./src/open-iconic-master/svg/share-boxed.svg">
            </button>  ${d.Time}</td>`;
            innerHtml+=`<td>${+d['Oxygen/Inspired gas setting [Volume Fraction] Ventilator (%)'] ? `<b style="color:red">ON</b>`: `<b style="color:green">WEANED</b>`}</td>`;
            innerHtml+=`<td>${d.rule_prediction>=rule_thres ? '<b>'+(d.rule_prediction*100).toFixed(2)+'%, ready to wean</b>' : 'Keep ('+(d.rule_prediction*100).toFixed(2)+'%)'}</td>`;
            innerHtml+=`<td>${ml_innerHtml}</td>`;            
            innerHtml+='</tr>';
        });
        document.getElementById("tbody").innerHTML = '';
        $('#example').DataTable().destroy();
        $('#example').find('tbody').html(innerHtml)
        var table = $('#example').DataTable();
        table.draw();

        overview(dataset_today, infoset_today, today);
    }
    
    function findAddress(arr){
        if(!arr)
            return 'n/a';
        return arr[0]?.line?.join() +', '+arr[0]?.city +', '+arr[0]?.state;
    }

    function findValue(arr, key){
        for(let i = 0; i<arr.length;i++){
            const d=arr[i];
            if(d.url?.includes(key) || d.system?.includes(key) || d.type?.text.includes(key)){
                if(d.extension){
                    return d.extension[0].valueCoding.display;
                } else if (d.value){
                    return d.value;
                }
            }
        }
        return 'n/a';
    }

});

function getRulePercent(data) {
    let res = 0;
    res += (+data['Heart rate (/min)'] >= 60 && +data['Heart rate (/min)'] <= 130 ? 1 : 0);
    res += (+data['Systolic Blood Pressure (mm[Hg])'] >= 90 && +data['Systolic Blood Pressure (mm[Hg])'] <= 180 ? 1 : 0);
    res += (+data['PEEP Respiratory system (cmH20)'] >= 12 && +data['PEEP Respiratory system (cmH20)'] <= 35 ? 1 : 0);
    res += (+data['pH of Arterial blood ([pH])'] >= 7.25 && +data['pH of Arterial blood ([pH])'] <= 7.45 ? 1 : 0);
    res += (+data['Oxygen saturation in Arterial blood (%)'] >= 92 && +data['Oxygen saturation in Arterial blood (%)'] <= 100 ? 1 : 0);
    res += (+data['Oxygen/Inspired gas setting [Volume Fraction] Ventilator (%)'] >= 0 && +data['Oxygen/Inspired gas setting [Volume Fraction] Ventilator (%)'] <= 50 ? 1 : 0);
    res /= 6.0;
    return res;
};

function overview(data_today, info_today, today) {

    setTimeout(() => {
        //vent used
        const vent_used = data_today.length;
        drawOverArc('vent_use_div', 20, vent_used);

        //vent time used
        const ids =  data_today.map(d=> d.Id);
        const data_agg = dataset.filter(d=>ids.includes(d.Id) && d.Date.slice(0,10)<=today);
        let id_count = {}, time_count = {};
        data_agg.forEach(d=>{
            id_count[d.Id] = id_count[d.Id] ? id_count[d.Id] + 1 : 1;
        })
        Object.values(id_count).forEach(d=>{
            const num = d+"";
            time_count[num] = time_count[num] ? time_count[num] + 1 : 1;
        })
        const xDomain_time = Object.keys(time_count);
        const yDomain_time = [0, Math.max(...Object.values(time_count))];
        drawOverBar('vent_time_div', time_count, xDomain_time, yDomain_time, 'Aggregated Ventilating Period (Days)');

        //age
        const ages = info_today.map(d=>(2021- +d.BIRTHDATE.slice(0,4)));
        let counts_age = {};
        let xDomain_age = ['<=10', '11-20','21-30','31-40','41-50','51-60','61-70','71-80','>80'];
        for (let i = 0; i < ages.length; i++) {
            let num = xDomain_age[Math.min(Math.floor(ages[i]/10),8)];
            counts_age[num] = counts_age[num] ? counts_age[num] + 1 : 1;
        }
        let yDomain_age = [0, Math.max(...Object.values(counts_age))];
        drawOverBar('age_div', counts_age, xDomain_age, yDomain_age, 'Age Range');

        //gender
        const genders = info_today.map(d=>(d.GENDER));
        let counts_gender = {};
        let xDomain_gender = ['male', 'female'];
        for (let i = 0; i < genders.length; i++) {
            let num = genders[i];
            counts_gender[num] = counts_gender[num] ? counts_gender[num] + 1 : 1;
        }
        let yDomain_gender = [0, Math.max(...Object.values(counts_gender))];
        drawOverBar('gender_div', counts_gender, xDomain_gender, yDomain_gender, 'Gender');

        //race
        const races = info_today.map(d=>(d.RACE));
        let counts_race = {};
        let xDomain_race = [...new Set(races)];
        for (let i = 0; i < races.length; i++) {
            let num = races[i];
            counts_race[num] = counts_race[num] ? counts_race[num] + 1 : 1;
        }
        let yDomain_race = [0, Math.max(...Object.values(counts_race))];
        drawOverBar('race_div', counts_race, xDomain_race, yDomain_race, 'Race');
        cnvSpinner.stop('spinner');
    }, 200)
};

function drawOverBar(div_id, data, xDomain, yDomain, xLabel){
    d3.select('#'+div_id).selectAll('*').remove();
    setTimeout(() => {
        let svg = d3.select('#'+div_id)
            .append("svg")
            .attr("height", 200)
            .attr("width", 500);
        let xScale = d3.scaleBand()
                    .domain(xDomain)
                    .range([50,480])
                    .paddingInner(0.1)
                    .paddingOuter(0.1);
        svg.append("g")
            .attr("transform", "translate(0,150)") 
            .call(d3.axisBottom(xScale).ticks(5));

        let yScale = d3.scaleLinear()
                    .domain(yDomain)
                    .range([150,10]);
        const yAxisTicks = yScale.ticks()
                    .filter(tick => Number.isInteger(tick));
        svg.append("g")
            .attr("transform", "translate(50,0)") 
            .call(d3.axisLeft(yScale)
            .tickValues(yAxisTicks)
            .tickFormat(d3.format('d'))
            .ticks(10));
        svg.append("g")
            .append('text')
            .attr("transform", "translate(250,185)")
            .attr("text-anchor", 'middle')
            .text(xLabel)
        svg.append("g")
            .append('text')
            .attr("transform", "translate(10,80)rotate(-90)")
            .attr("text-anchor", 'middle')
            .text('Count')
        Object.keys(data).forEach(d=>{
            svg.append('rect')
                .attr('x', xScale(d))
                .attr('y', yScale(data[d]))
                .attr('width', xScale.bandwidth())
                .attr('height', Math.abs(yScale(0)-yScale(data[d])))
                .attr('fill', '#0275d8')
        })
    }, 100)
}

function drawOverArc(div_id, total, used){
    d3.select('#'+div_id).selectAll('*').remove();
    setTimeout(() => {
        let svg = d3.select('#'+div_id)
            .append("svg")
            .attr("height", 200)
            .attr("width", 500)
            .append("g")
            .attr("transform", "translate(150,100)");

        var input = [
            {name: "used", size: used},
            {name: "unused", size: total-used},
        ];
    
        var angleGen = d3.pie()
                .startAngle(0)
                .endAngle(2 * Math.PI)
                .padAngle(.05)
                .value((d) => d.size)

        var data = angleGen(input);

        var arcGen = d3.arc()
                        .innerRadius(40)
                        .outerRadius(90);

        const color = {
            'unused':'#0275d8',
            'used':'#f0ad4e'
        }
        svg.selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", arcGen)
            .attr("fill", (d) => color[d.data.name])
            .attr("stroke", "gray")
            .attr("stroke-width", 1);
        svg.append('text')
            .attr("transform", "translate(130,-50)")
            .attr("text-anchor", 'start')
            .attr('fill', '#000')
            .attr('font-weight', 700)
            .text('Total: '+total)
        svg.append('text')
            .attr("transform", "translate(130,0)")
            .attr("text-anchor", 'start')
            .attr('fill', color['used'])
            .attr('font-weight', 700)
            .text('In Using: '+used)
        svg.append('text')
            .attr("transform", "translate(130,50)")
            .attr("text-anchor", 'start')
            .attr('fill', color['unused'])
            .attr('font-weight', 700)
            .text('Available: '+(total-used))
    }, 100)
}
