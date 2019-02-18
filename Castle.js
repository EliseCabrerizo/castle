const fetch = require('node-fetch');
var request = require('request-promise');
var cheerio = require('cheerio');

var hotelInfos = [];
var restauInfos = [];
async function sandbox() {

    for (var i = 1; i <8 ; i++) {
        var response = await fetch('https://www.relaischateaux.com/fr/update-destination-results', {
            "credentials": "include",
            "headers": {
                "accept": "/",
                "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://www.relaischateaux.com/fr/destinations/europe/france",
            "referrerPolicy": "origin-when-cross-origin",
            "body": "rc_destination_availability_type%5Barea%5D=78&rc_destination_availability_type%5Bstart%5D=&rc_destination_availability_type%5Bend%5D=&rc_destination_availability_type%5BnbRooms%5D=1&rc_destination_availability_type%5B_token%5D=kDUa3iIcFhM65bbJehR03feJpS_7Qyu2wc0okgKKEe4&page=" + i + "&submit=true&areaId=78",
            "method": "POST",
            "mode": "cors"
        })

        var body = (await response.json());
        var $ = cheerio.load(body.html);

        const elements = $('.mainTitle3').get();
        for (element of elements) {
            //Regarde ce que contient le noeud précédent (Hotel + Restaurant, Hotel ou Restaurant)
            var HotelRestau = $(element).parent().prev().first().first().first().text();
            //Si la chaine ne contient pas  hotel + restaurant alors il renvoit -1
            if (HotelRestau.indexOf('Hôtel + Restaurant') != -1) {
                const nomHotelText = $(element).text().trim();
                const url = $(element).find('a').attr('href');
                var info = await URLRestaurant(url);
                hotelInfos.push({
                    nomHotelText,
                    url,
                    info
                });
                //console.log(nomHotelText);
                //console.log(info);
            }
        }
    }
}

async function URLRestaurant(url) {
    let infos = [];
    var html = await request(url);
    var $ = cheerio.load(html);
    var touteurl = "";
    var url2 = null;
    const elements = $('.jsSecondNav ul li').get();
    for (element of elements) {
        var url2 = $(element).find('a').attr('href');
        if (url2.indexOf("/restaurant/") != -1) {
            if (touteurl.indexOf(url2) == -1) {
                touteurl += ("\n" + url2);
                infos.push(await telVilleRestau(url2));
            }
        }
    }
    return infos;
}

async function telVilleRestau(url) {
    var tel = '';
    var ville = '';
    var html = await request(url);
    const $ = cheerio.load(html);
    var nom = $('.hotelTabsHeaderTitle').text().trim(); //permet de supprimer les espaces avant et après
    var teltemp = $('.btn.btnGold.btnMedium').text().trim();
    var tel = teltemp.substring(teltemp.indexOf('+'), teltemp.length);
    return ({
        nom,
        tel
    });
}

async function URLRestauMichelin() {
    for (var i = 1; i < 35; i++) {
        if (i == 1) {
            var html = await request('https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin');
            var $ = cheerio.load(html);
            const elements = $('.poi_card-display-title').get();
            for (element of elements) {
                var title = $(element).text().trim();
                var url = $(element).parent().parent().parent().attr('href');
                var contact = await TelephoneLieuMichelin('https://restaurant.michelin.fr' + url, title);
                restauInfos.push({
                    title,
                    contact
                });
            }

            //co-nsole.log(title);
            //console.log(contact);

        } else {
            var html = await request('https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-' + i);
            var $ = cheerio.load(html);
            const elements = $('.poi_card-display-title').get();
            for (element of elements) {
                var title = $(element).text().trim();
                var url = $(element).parent().parent().parent().attr('href');
                var contact = await TelephoneLieuMichelin('https://restaurant.michelin.fr' + url, title);
                restauInfos.push({
                    title,
                    contact
                });
            }
        }
    }
}

async function TelephoneLieuMichelin(url, title) {
    var tel = '';
    var ville = '';
    var html = await request(url);
    const $ = cheerio.load(html);
    tel = $('.tel').text();
    ville = $('.locality').text();
    return ({
        tel,
        ville
    });
}

async function trouver3etoiles() {
    const info = await URLRestauMichelin();
    const lol = await sandbox();
    for (var i = 0; i < hotelInfos.length; i++) {
        for (var j = 0; j < restauInfos.length; j++) {
            var telHotel = (hotelInfos[i].info[0].tel);
            var tel = restauInfos[j].contact.tel.substr(1, restauInfos[j].contact.tel.length);
            if (telHotel.indexOf(tel)!=-1) {
                console.log(hotelInfos[i]);
            }
        }
    }
}

//URLRestauMichelin();
//URLRestaurant('https://www.relaischateaux.com/us/france/bussiere-cote-d-or-la-bussiere-sur-ouche');
//sandbox();

trouver3etoiles();