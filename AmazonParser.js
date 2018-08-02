class AmazonParser
{
	constructor()
	{

	}
	/*
		Parses the vendor section of
	*/

	log(args)
	{
		if( this.debug  )
		{
			console.log( args );
		}
	}

	getVendorInfoFromVendorInfoPage()
	{
		//var version = this.getVersionLambda('getVendorInfoFromVendorInfoPage');
	}

	/*
	*/


	getParameters( url )
	{

		let start 	= url.indexOf('?');
		let end 	=  url.indexOf('#');

		if( start === -1 )
			return {};

		let x = url.substring(start+1, end == -1 ? url.length : end  );

		let finalString = x;
		if( finalString.indexOf('?') === 0 )
		{
			finalString = finalString.substring( 1, finalString.length-1 );
		}

		let parametersArray	= finalString.split('&');

		let obj = {};

		for(let i=0;i<parametersArray.length;i++)
		{
			let s = parametersArray[i].split('=');

			if( s.length > 1 )
			{
				let value = decodeURIComponent( s[ 1 ] ).replace(/\+/g,' ').toLowerCase();

				if( s[0] in obj )
				{
					if( Array.isArray( obj[ s[0] ] ) )
						obj[ s[0] ].push(  value  );
					else
						obj[ s[0] ] = [ obj[s[0] ], value ];
				}
				else
				{
					obj[ s[0] ] = value;
				}
			}
		}
		return obj;
	}

	getProductsFromVendorInfoPageSectionProducts()
	{
		let version		= this.getVersionLambda('VendorProductSectionParser');
		let productsArray	= document.queryAll('#products-results-data  .product-details');

		for(var i=0;i<productsArray.length;i++)
		{
			var product = {};
			product.versions = [];

			version(product,'extracted',1,window.location.href);


			var ptitle = productsArray[i].querySelector('.product-title a[title]');

			if( ptitle )
			{
				product.title = ptitle.getAttribute('title');
				version(product,'title',1, product.title);

				product.url 	= this.cleanPicassoRedirect( ptitle.getAttribute('href') );
				version(product,'url',1 ,product.url );
			}

			var prating = productsArray[i].querySelector('.product-rating a[title]');

			if( prating )
			{
				product.rating = prating.getAttribute('title');
				version(product,'rating',1, product.rating );
			}

			var nrating = productsArray[i].querySelector('.product-rating:not([title])');
			if( nrating  )
			{
				product.number_of_ratings = nrating.textContent.trim();
				version(product,'no_rating',1, product.number_of_ratings);
			}

			var pprice = productsArray[i].querySelector('.product-price');

			if( pprice )
			{
				product.price = pprice.textContent.trim();
				version(product,'no_price',1, product.price );
			}

			productsArray.push( product );
		}

		return productsArray;
	}

	getProductFromProductPage()
	{

		let date	= new Date();

		// jshint shadow: true
		let product 		= {};
		product.versions	= [];
		product.images 	= [];
		product.offers 	= [];
		product.stock		= [];

		product.parsed	= date.toISOString();
		product.parsedDates	= [ this.getDateString( date ) ];
		product.search		= [];

		this.getSearchTerms( window.location.search ).forEach((term)=>
		{
			product.search.push( term );
		});

		let version	= this.getVersionLambda('getProductFromProductPage');

		product.url	= window.location.href;

		version( product,'extracted',1,window.location.href );

		let description 	= document.querySelector('#productDescription>p');

		if( description )
		{
			product.description	= description.textContent.trim();
			version( product , 'description', 1, product.description );
		}


		var productTitle	= document.getElementById('productTitle');

		if( productTitle )
		{
			product.title = productTitle.textContent.trim();
			version( product , 'title', 1, product.title );
		}

		var producer 	= document.querySelector('#bylineInfo_feature_div a');

		product.producer = '';

		if( producer )
		{
			product.producer		= producer.textContent.trim().toLowerCase();
			product.producer_url	= producer.getAttribute('href');
			version( product , 'producer', 1, product.producer );
		}

		//Tes with
		//https://www.amazon.com/dp/B01HDNSF3K/ref=sxr_pa_click_within_right_3?pf_rd_m=&pf_rd_p=&pf_rd_r=&pd_rd_wg=5I2b0&pf_rd_s=desktop-rhs-carousels&pf_rd_t=301&pd_rd_w=ykYhM&pf_rd_i=lenovo+amd+laptop&pd_rd_r=&psc=1
		if( producer && product.producer === '' )
		{
			var href	= producer.getAttribute('href');
			product.producer	= href.substring(1, href.indexOf('/',1) ).toLowerCase();
			version( product , 'producer', 2, product.producer );
		}

		if( product.producer === '' )
		{
			producer = document.querySelector('#brandBylineWrapper #brand');

			if( producer )
			{
				product.producer = producer.textContent.trim().toLowerCase();
				version( product , 'producer', 3, product.producer );
			}
		}

		if( product.producer === '' )
		{
			let brand = document.querySelector('#brand');
			if( brand )
			{
				product.producer = brand.textContent.trim().toLowerCase();
				version( product , 'producer', 4, product.producer );
			}
		}

		if( product.producer === '' )
		{
			let brand = document.querySelector('.author.notFaded');
			if( brand )
			{
				product.producer = brand.textContent.trim().toLowerCase();
				version( product , 'producer', 5, product.producer );
			}
		}

		if( product.producer === '' )
		{
			let brand = document.querySelector('#bylineInfo');

			if( brand )
			{
				product.producer = brand.textContent.trim().toLowerCase();
				version( product , 'producer', 6, product.producer );
			}

			if( product.producer == '' && brand && brand.tagName == 'A' )
			{
				let href = brand.getAttribute('href');
				let clean	= href.substring( 1, href.length-1 );
				product.producer = clean.substring(0, clean.indexOf('/') ).toLowerCase();
			}
		}

		var lefts	= document.querySelectorAll('span.a-size-medium.a-color-price');
		if( lefts )
		{
			var plefts	= Array.from( lefts );
			product.left		= '';

			//"Only 6 left in stock - order soon."
			//
			for(let i=0;i<plefts.length;i++)
			{
				if( /only \d+ left in stock/i.test( plefts[ i ].textContent ) )
				{
					product.left = plefts[ i ].textContent.trim();
					version( product ,'left', 1, product.left);
					break;
				}
				if( /Currently unavailable./i.test( plefts[ i ].textContent ) )
				{
					product.left = 'Currently unavailable.';
					version( product ,'left', 2, product.left);
					break;
				}
			}
		}

		if( typeof product.left  === 'undefined' || product.left === '' )
		{
			let availability = document.querySelectorAll('[data-feature-name="availability"]');

			for( let i = 0; i<availability.length;i++)
			{
				let text = availability[ i ].textContent.replace(/\s+/gm,' ').trim();
				if( text == 'In Stock.' )
				{
					product.left	= 'In Stock.';
					version( product ,'left', 3, product.left);
					break;
				}

				if( /Available from these sellers./i.test( text ) )
				{
					product.left = 'Available from other sellers';
					version( product ,'left', 4, product.left);
					break;
				}

				if( /in stock on [A-Za-z]+ \d{1,2} 20\d{2}/i.test( text ) )
				{
					product.left = plefts[ i ].textContent.trim();
					version( product ,'left', 5, product.left);
					break;
				}
			}
		}

		if( typeof product.left  === 'undefined' || product.left === '' )
		{
			let availability = document.getElementById('availabilityInsideBuyBox_feature_div');

			if( availability )
			{
				let textContainer = availability.querySelector('#availability');
				if( textContainer )
				{
					let text = textContainer.textContent.trim();

					if( /only \d+ left in stock/i.test( text ) )
					{
						product.left = plefts[ i ].textContent.trim();
						version( product ,'left', 6, product.left);
					}

					if( /Currently unavailable./i.test( text ) )
					{
						product.left = 'Currently unavailable.';
						version( product ,'left', 7, product.left);
					}

					if( /in stock on [A-Za-z]+ \d{1,2} 20\d{2}/i.test( text ) )
					{
						product.left = plefts[ i ].textContent.trim();
						version( product ,'left', 8, product.left);
					}
				}
			}
		}

		var choice	= document.querySelectorAll('div.ac-badge-wrapper');

		if( choice )
		{
			var pchoice = Array.from( choice );
			for(let i=0;i<pchoice.length;i++)
			{

				let text = pchoice[ i ].textContent.trim().replace(/[\r\n\s]+/gm,' ');

				if( /amazon's choice/i.test( text  ) )
				{
					let index	= text.toLowerCase().indexOf('amazon\'s choice for');
					product.choice	= text.substring( index );
					version( product ,'choice', 1, product.left);
					break;
				}
			}
		}

		product.asin	= this.getAsinFromUrl( window.location.href );

		if( product.asin )
		{
			version( product, 'ASIN',1 ,product.asin );
		}

		var sale = document.getElementById('priceblock_saleprice_row #priceblock_saleprice');
		let offer	= {};

		if( sale )
		{
			//Sael v4
			offer.price = sale.textContent.trim();
			version( product ,'sale', 4, offer.price );
		}
		if( sale )
		{
			//sale V1
			offer.price 	 = sale.textContent.replace(/Sale:/g,'').trim();
			version( product ,'sale', 1, offer.price );
		}
		else if( (sale = document.querySelector('#price span.a-size-medium.a-color-price')) )
		{
			//sale V2
			offer.price= sale.textContent.trim();
			version( product ,'sale', 2, offer.price );
		}
		else if( ( sale = document.querySelector('div.a-section>span.a-size-large.a-color-price') ) )
		{
			//sale V3
			offer.price = sale.textContent.trim();
			version( product ,'sale', 3, offer.price );
		}
		else if( (sale = document.querySelector('div#formats div#tmmSwatches li a>span:last-child') ) )
		{
			let toSearch	= 'from $';
			let index		=  sale.textContent.trim().indexOf( toSearch );
			offer.price		= '';

			if( index > -1 )
			{
				offer.price = sale.textContent.trim().substring( index+toSearch.length );
			}
			version( product ,'sale', 4, offer.price );
		}


		//Shipping
		//
		let shipping = document.querySelector('#priceblock_ourprice_row #ourprice_shippingmessage b');

		if( shipping )
		{
			version( product ,'shipping', 3, offer.shipping );
			offer.shipping =  shipping.textContent;
		}

		if( typeof offer.shipping === 'undefined' )
		{

			shipping = document.querySelector('a.cfs-free-shipping');

			if( shipping )
			{
				offer.shipping = shipping.textContent.trim();
				version( product ,'shipping', 1, offer.shipping );
			}
		}


		if( typeof offer.shipping === 'undefined' )
		{
			shipping = document.querySelector('#priceblock_ourprice_row');
			if( shipping )
			{
				offer.shipping = shipping.textContent.trim().replace(/\n/g,' ').replace(/.*(\$\d+(\.\d+)? shipping).*/,'$1');
				version( product ,'shipping', 2, product.price );
			}
		}

		var fullfilled = document.querySelector('#merchant-info');

		if( fullfilled )
		{
			offer.fullfilled_by = fullfilled.textContent.trim().toLowerCase().includes('fulfilled by amazon') ? 'AMAZON':'';
			version( product ,'fullfilled', 1, offer.fullfilled_by );
		}
		if(fullfilled && offer.fullfilled_by === '' )
		{
			offer.fullfilled_by = fullfilled.textContent.trim().toLowerCase().includes('ships from and sold by') ? 'VENDOR':'';
			version( product ,'fullfilled', 2, offer.fullfilled_by );
		}


		if( offer.price )
		{
			product.price		= offer.price;
			product.offers.push( offer );
		}



		//Especs
		product.spec= {};

		var specTable = document.querySelectorAll('[id="product-specification-table"]');
		if( specTable.length )
		{
			for(let j=0;j<specTable.length;j++)
			{
				let tr = specTable[j].querySelectorAll('tr');

				for(let k=0;k<tr.length;k++)
				{
					let th = tr[k].querySelector('th');
					let td = tr[k].querySelector('td');
					product.spec[ th.textContent.trim().replace(/:$/,'') ] = td.textContent.trim();
				}
			}

			//V1
			version( product ,'specs', 1, '' );
		}

		var technical_specs = document.querySelectorAll('#technicalSpecifications_section_1 tr');

		if( technical_specs.length )
		{
			for(let i=0;i<technical_specs.length;i++)
			{
				let tr = technical_specs[i];
				let key = tr.querySelector('th').textContent.trim().replace(/:$/,'');
				let value = tr.querySelector('td').textContent.trim();
				product.spec[ key ] = value;
			}

			//V2
			version( product ,'specs', 2 , '');
		}

		//Features
		var features = document.querySelectorAll('#feature-bullets-btf .bucket.normal li');
		product.features = [];

		if( features.length )
		{
			for(let i=0;i<features.length;i++)
			{
				product.features.push(features[ i ].textContent.trim() );
			}

			//V1
			version( product ,'features', 1, '' );
		}

		features = document.querySelectorAll('#featurebullets_feature_div li:not(.aok-hidden)');

		if( features )
		{
			for(var i=0;i<features.length;i++)
			{
				product.features.push(features[ i ].textContent.trim() );
			}
			//V2
			version( product ,'features', 2, '' );
		}

		//Details
		product.productDetails	= {};

		var details = document.querySelectorAll('#productDetailsTable .content li');

		if( details.length )
		{
			for(let i=0;i<details.length;i++)
			{
				let detail = details[i].querySelector('b').textContent.trim().replace(/:$/,'');
				var fullDetail = details[i].textContent.replace( detail, '');
				product.productDetails[ detail.trim() ] = fullDetail.trim();
				//V1
			}
			version( product ,'details', 1, '' );
		}

		details = document.querySelectorAll('#productDetails_detailBullets_sections1 tr');

		if( details.length )
		{
			for(let i=0;i<details.length;i++)
			{
				let detail					= details[ i ].querySelector('th').textContent.trim().replace(/:$/,'');
				var fullDetail2 			= details[ i ].querySelector('td').textContent;
				product.productDetails[ detail ]	= fullDetail2.trim();
			}
			//V2
			version( product ,'details', 2, '' );
		}

		details = document.querySelectorAll('#prodDetails table tr');

		if( details.length )
		{
			for(let i=0;i<details.length;i++)
			{
				let label = details[i].querySelector('.label');
				let value = details[i].querySelector('.value');

				if( label && value )
				{
					product.productDetails[ label.textContent.trim().replace(/:$/,'') ] = value.textContent.trim();
				}
			}
			//V3
			version( product ,'details', 3, '' );
		}

		var prating = document.querySelector('#averageCustomerReviews_feature_div #acrPopover');
		if( prating )
		{
			///^-?\d*(\.\d+)?$/
			product.rating = prating.getAttribute('title').trim().replace(/(\d+(\.\d+)?) out of \d+ stars.*/,'$1');
			//         prating.getAttribute('title').trim().replace(/.*(\d+(\.\d+)?) out of \d+ stars.*/,'$1');
			version(product,'rating',1, product.rating );
		}

		var nrating = document.querySelector('#averageCustomerReviews_feature_div #acrCustomerReviewLink');
		if( nrating )
		{
			product.number_of_ratings = nrating.textContent.trim().replace(/(\d+).*/,'$1');
			version(product,'no_rating',1, product.number_of_ratings);
		}


		if( typeof product.number_of_ratings === 'undefined' && typeof product.productDetails['Customer Reviews'] !== 'undefined')
		{
			var rating_text = product.productDetails['Customer Reviews'].replace(/.*(\d+) out of \d+ stars.*/,'$1');
			var no_ratings	=  product.productDetails['Customer Reviews'].replace(/.*(\d+) customer reviews.*/,'$1');

			if( rating_text )
			{
				product.rating = rating_text;
				version(product,'rating',2, product.rating );
			}

			if( no_ratings )
			{
				product.number_of_ratings = no_ratings;
				version(product,'no_rating',2, product.rating );
			}
		}

		//Cleaning ratings
		if( typeof product.number_of_ratings !== 'undefined' )
		{
			if( product.number_of_ratings === 'Be the first to review this product'
					|| product.number_of_ratings.includes('Be the first to review this item') )
				product.number_of_ratings = '0';
		}


		//if( typeof product.productDetails['Average Customer Review:'] )
		//	delete product.productDetails['Average Customer Review:'];

		//Images
		var imagesElement	= document.querySelector('#imageBlock_feature_div');

		if( imagesElement )
		{
			var images = imagesElement.innerHTML;
			var data	= images.indexOf('var data = {');
			var sub1	= images.substring( data+10 );
			var data2   = sub1.indexOf('};')+1;
			var data3   = sub1.substring(0,data2).replace(/'/g,'"');

			try
			{
				var z		= JSON.parse( data3 );

				for(let i=0;i<z.colorImages.initial.length;i++)
				{
					if( z.colorImages.initial[i].hiRes )
						product.images.push( z.colorImages.initial[i].hiRes );
				}

				version( product ,'images', 1, '' );
			}
			catch(e)
			{
				//console.log('It fail to get images');
			}
		}

		imagesElement = document.querySelector('img#miniATF_image.a-dynamic-image.miniATFImage');

		if( imagesElement )
		{
			var imgSr = imagesElement.getAttribute('src');
			if( imgSr )
				product.images.push( imgSr );

			version( product ,'images', 2, '' );
		}


		//Vendors
		var vendors = document.querySelectorAll('#moreBuyingChoices_feature_div .pa_mbc_on_amazon_offer span[data-a-popover]');

		if( vendors.length )
		{
			product.vendors = [];

			for(let i=0;i<vendors.length;i++)
			{
				try
				{
					this.log( vendors[i].getAttribute('data-a-popover') );

					var obj = JSON.parse( vendors[i].getAttribute('data-a-popover') );

					if( typeof obj.url !== 'undefined' )
					{
						product.vendors.push(  obj.url  );
					}
				}
				catch(e)
				{
					this.log('IGNORE:',e );
				}
			}

			version( product ,'vendors', 1, '' );
		}


		//Other Vendors
		var otherVendors = document.querySelectorAll('#olp_feature_div a');

		if( otherVendors.length )
		{
			product.no_offers_url = otherVendors[0].getAttribute('href');
			product.no_offers = otherVendors[0].textContent.replace(/.*\((\d+)\).*/g,'$1');
			product.no_offers_text = otherVendors[0].textContent.trim();
			version( product ,'no_offers', 1, '' );
		}



		//Ratings

		return product;
	}


	parseVariationUrlsFromPattern()
	{
		let divs = document.querySelectorAll('#shelfSwatchSection-size_name div[data-dp-url],#shelfSwatchSection-item_package_quantity div[data-dp-url]');
		let variations	= Array.from( divs );

		let urls = [];
		variations.forEach((i)=>
		{
			let partialUrl = i.getAttribute('data-dp-url');

			if( partialUrl )
				urls.push( 'https://amazon.com/'+partialUrl );
		});

		return urls;
	}

	parseVariationUrls(name)
	{
		let variations = [];
		let variationContainer = document.querySelector( name );

		if( variationContainer !== null )
		{
			let variationsData = variationContainer.querySelectorAll('ul li');

			variationsData.forEach((li)=>
			{
				//XXXX FIX THIS
				//var asin 	= li.getAttribute('data-defaultasin');
				var url		= 'https://amazon.com'+li.getAttribute('data-dp-url');
				variations.push( url );
			});
		}

		return variations;
	}

	parseVariationColorUrls()
	{
		return this.parseVariationUrls('#variation_color_name');
	}

	parseVariationSizeUrls()
	{
		return this.parseVariationUrls('#variation_size_name');
	}
	//XXX  Please standardize this function
	//Change vendors for sellers
	//Create products with offers instead of whaterver it returns

	parseOtherVendors()
	{
		var asin	= this.getAsinFromUrl( window.location.href );
		//var a		= document.querySelectorAll('#olpOfferList h3.olpSellerName a');
		this.log('Vendor url match',asin);


		var rows = Array.from( document.querySelectorAll('#olpOfferList div.olpOffer') );

		//var priceColumn	= document.querySelectorAll('a-column a-span2 olpPriceColumn');

		var productVendors	= {
			asin		: asin
			,vendors	: []
		};

		rows.forEach((row)=>
		{
			let objRow		= {};

			let amazon		= row.querySelector('.olpSellerColumn img[alt="Amazon.com"]');

			if( amazon )
			{
				objRow.sellerName = 'Amazon.com';
			}
			else
			{
				objRow.sellerName	= row.querySelector('h3.olpSellerName a').textContent;
			}

			let price = row.querySelector('.olpOfferPrice');

			if( price )
				objRow.price	= row.querySelector('.olpOfferPrice').textContent.trim();

			var shipping        = row.querySelector('.olpShippingInfo');
			objRow.shipping		= shipping ? shipping.textContent : '';
			objRow.isPrime		= row.querySelector('.a-icon-prime') !== null;
			objRow.condition	= row.querySelector('.olpCondition').textContent;

			var amazonFullfill	= row.querySelector('a.olpDeliveryColumn');

			if( amazonFullfill && amazonFullfill.textContent.trim() === 'Fulfillment by Amazon' )
			{
				objRow.fullfillBy = 'Amazon';
			}
			else
			{
				objRow.fullfillBy = 'Vendor';
			}
			productVendors.vendors.push( objRow );
		});

		return productVendors;
	}

	getVersionLambda( func_name )
	{
		return ( product, name, version)=>
		{
			product.versions.push({attr: name, func:func_name, version: version});
		};
	}

	getProductFromBuyBox()
	{
		var box = document.querySelector('#desktop_buybox');
		let date = new Date();

		if( box )
		{
			var product = {};
			product.images 	= [];
			product.offers 	= [];
			product.stock		= [];
			product.versions	= [];

			product.parsed	= date.toISOString();
			product.parsedDates	= [ this.getDateString( date ) ];
			product.search		= [];


			product.asin 		= this.getValueSelector(box,'input[name="ASIN"]');

			//product.merchant_id	= inputLmbda(box,"merchantID");
			//product.selling_customer_id	= inputLmbda(box,"sellingCustomerID");
			//product.sale 		= this.getValueSelector( box, '#price_inside_buybox' );

			let shipFromSold	= this.getValueSelector( box, '#merchant-info');

			//let shipTextx		= '';

			//if( shipFromSold  && /Gift-wrap available./.test( shipFromSold ) )
			//{
			//	shipTextx = shipFromSold.substring( 0, shipFromSold.toLowerCase().indexOf('gift-wrap available') ).trim();
			//}

			let fullfilled_by = '';
			let vendor_name		= '';

			if( /ships from and sold by Amazon.com/i.test( shipFromSold ) )
			{
				fullfilled_by	= 'AMAZON';
				vendor_name		= 'Amazon.com';
			}

			let offer = {
				rsid			: this.getValueSelector( box, 'input[name="rsid"]')
				,price			: this.getValueSelector( box, '#price_inside_buybox' )
				,merchantId		: this.getValueSelector( box, 'input[name="merchantID"]')
				,shipping		: this.getValueSelector( box, '#price-shipping-message')
				,vendor_name	: vendor_name
				,fullfilled_by	: fullfilled_by
			};

			product.offers = [ offer ];
		}

		return product;
	}

	getAsinFromUrl( a )
	{
		let url = a === undefined ? window.location.href : a ;

		var asin	= url.replace(/.*\/dp\/(\w+)(:?\/|\?).*/,'$1');

		if( asin.includes('https://' ) )
		{
			asin = url.replace(/^.*\/gp\/offer-listing\/(\w+)\/.*/,'$1');
		}

		if( asin.includes('https://') )
		{
			asin = url.replace(/^.*\/gp\/product\/(\w+).*$/,'$1');
		}

		if( asin.includes('https://') )
		{
			asin = url.replace(/.*\/dp\/(\w+)$/,'$1');
		}

		return asin;
	}

	getPageType( href )
	{
		let cleanUrl  = this.cleanPicassoRedirect( href ).replace(/\/\//g,'/');

		if( /\/gp\/huc\/view.html\?.*newItems=.*$/.test( cleanUrl ) )
			return 'PREVIOUS_TO_CART_PAGE';

		if( /^https:\/\/www.amazon.com\/gp\/offer-listing.*/.test( cleanUrl ) )
			return 'VENDORS_PAGE';

		if( /^https:\/\/www.amazon.com\/(?:.*)?dp\/(\w+)(?:\?|\/)?.*$/.test( cleanUrl ) ||
			/^https:\/\/www.amazon.com\/gp\/product\/(\w+)(?:\?|\/)?.*$.*/.test( cleanUrl ) )
			return 'PRODUCT_PAGE';

		//https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias=aps
		//if( /\/s\/ref=nb_sb_noss_2.url=search-alias.3Daps/.test( href ) )
		if( /&field-keywords=\w+/.test( cleanUrl ) || /\/s\/ref=sr_pg_\d+\?/.test( cleanUrl ) )
			return 'SEARCH_PAGE';

		if( /amazon\..*\/gp\/cart\/view.html/.test( cleanUrl ) || /\/gp\/item-dispatch\/ref=/.test( cleanUrl ) )
			return 'CART_PAGE';

		if( /marketplaceID=(\w+)&/.test( cleanUrl ) )
		{
			return 'SEARCH_PAGE';
		}

		return "NO_DETECTED";
	}

	getValueSelector(node,selector)
	{
		let selElement = node.querySelector( selector );
		if( selElement )
		{
			if( selElement.tagName === 'INPUT' || selElement.tagName === 'SELECT' )
			{
				if( selElement.value.trim() === '' )
					return null;

				return selElement.value.trim();
			}

			if( selElement.textContent !== '' )
			{
				return selElement.textContent.trim();
			}
		}

		return null;
	}

	getSearchListSelector()
	{
		let counter = 15;
		return '#resultsCol li[data-asin]:nth-child('+counter+'),#s-results-list-atf li[data-asin]:nth-child('+counter+')';
	}

	parseProductSearchList()
	{
		let parameters	= this.getParameters( window.location.search );
		let search		= [];
		let paramKeys	= ['field-keywords'];

		paramKeys.forEach((key)=>
		{
			if( key in parameters )
			{
				if( Array.isArray( parameters[ key ] ) )
				{
					parameters[key].forEach((value)=>{ search.push( value ); });
				}
				else
				{
					search.push( parameters[ key ] );
				}
			}
		});

		let date	= new Date();
		let dateStr = this.getDateString( date );

		let s = document.querySelectorAll('#s-results-list-atf li[data-asin]');
		let items = Array.from( s );
		let productsArray = [];

		items.forEach(( i)=>
		{
			let a	  = i.querySelector('a.s-access-detail-page');

			if( a == null )
				return;

			let title = a.getAttribute('title');

			if( !title )
				return;

			let url	= this.cleanPicassoRedirect( a.getAttribute('href') );

			//let parameters = this.getParameters( url );

			let producer_name = '';


			let pn_selectors =
			{
				'div>div:nth-child(5)>div:nth-child(2)>span:nth-child(1)':'div>div:nth-child(5)>div:nth-child(2)>span:nth-child(2)'
				,'div>div:nth-child(3)>div:nth-child(2)>span:nth-child(1)':'div>div:nth-child(5)>div:nth-child(2)>span:nth-child(2)'
				,'div>div>div>div.a-fixed-left-grid-col.a-col-right>div.a-row.a-spacing-small>div:nth-child(2)>span:nth-child(1)':'div>div>div>div.a-fixed-left-grid-col.a-col-right>div.a-row.a-spacing-small>div:nth-child(2)>span:nth-child(2)'
			};

			let keys = Object.keys( pn_selectors );

			for(let j=0;j<keys.length;j++ )
			{
				if( this.getValueSelector( i, keys[ j ] ) == 'by' )
				{
					producer_name = this.getValueSelector(i, pn_selectors[ keys[j] ] );
					break;
				}
			}

			////let producer_name =  this.getValueSelector(i,'.a-row.a-spacing-small > .a-row.a-spacing-none:last-of-type');
			//let producer_name =  this.getValueSelector(i,'.a-row.a-spacing-mini > .a-row.a-spacing-none:last-of-type');

			if( !producer_name )
				producer_name = '';

			let  offersPrice = Array.from( i.querySelectorAll('a>span.a-offscreen'));


			let offers = [];

			offersPrice.forEach(( offerElement )=>
			{
				let isPrime		= offerElement.parentElement.parentElement.querySelector('[aria-label="Prime"]');
				let description	= null;

				let subscribeAndSave = /Subscribe & Save/.test( offerElement.parentElement );

				if( subscribeAndSave )
					description = 'Subscribe & Save';

				let offer		= {
					price			: offerElement.textContent.trim()
					,url			: this.cleanPicassoRedirect( offerElement.parentElement.getAttribute('href') )
					,description	: description
					,date			: dateStr
					,time			: date.toISOString()
				};


				if( isPrime )
					offer.is_prime = true;

				offers.push( offer );
			});

			let stock = [];

			if( offers.length == 1 )
			{
				let text = i.textContent.replace(/\s+/gm,' ');

				if( /only \d+ left in stock/i.test( text ) )
				{
					let href = i.querySelector('a.s-access-detail-page');

					stock.push({
						qty		: text.replace(/^Only (\d+) left in stock.*/,'$1' )
						,url	: this.cleanPicassoRedirect( href.getAttribute('href') )
						,date	: dateStr
						,time	: date.toISOString()
					});
				}
			}

			if( offersPrice.length )
			{

				let product = {
					asin	: i.getAttribute('data-asin')
					,url	: url
					,title	: title.replace(/^\[Sponsored\](.*)$/,'$1')
					,offers	: offers
					,stock	: stock
					,search	: search
					,seller_ids	: []
					,sellers	: []
					,producer	: producer_name.toLowerCase()
				};

				if( product.asin )
					productsArray.push( product );
			}
		});

		return productsArray;
	}

	//Test with laptop search ex Apire e5
	parseProductSearchList2()
	{
		let items = Array.from( document.querySelectorAll('#resultsCol li[data-asin]') );

		let productsArray = [];
		let date = new Date();

		items.forEach((i)=>
		{
			let product = {
				offers	: []
				,stock	: []
				,search	: []
				,sellers: []
				,seller_ids	: []
			};

			let a = i.querySelector('div > div:nth-child(3) > div:nth-child(1) > a[title]');

			if( !a )
				return;

			product.title	= a.getAttribute('title');
			product.asin	= i.getAttribute('asin');
			product.link	= a.getAttribute('href');
			product.time	= this.getDateString( date );
			product.parsed	= date.toISOString();
			product.parsedDates	=[ this.getDateString( date ) ];


			let producer_name = '';

			if( this.getValueSelector(i, 'div > div:nth-child(3) > div:nth-child(2) > span:nth-child(1)') == 'by' )
			{
				producer_name = this.getValueSelector(i,'div > div:nth-child(3) > div:nth-child(2) > span:nth-child(2)');
			}

			let shipping  = this.getValueSelector(i,'div > div:nth-child(4) > div:nth-child(2) > div:nth-child(2) > span');

			let offer	= {};

			//XXX Do something with this
			//let params	= this.getParameters( product.link );

			if( /\bshipping\b/i.test( shipping ) )
			{
				offer.shipping = shipping;
			}
			product.price = this.getValueSelector(i,'span.a-offscreen');
			offer.price = product.price;
			let prime = i.querySelector('i[aria-label="Prime"]');

			if( prime )
				offer.is_prime = true;

			product.producer	= producer_name.toLowerCase();
			product.offers	= [];
			product.stock	= [];

			if( offer.price )
				product.offers.push( offer );

			productsArray.push( product );
		});

		return productsArray;
	}

	mergeProducts()
	{

	}

	cleanPicassoRedirect( href )
	{
		if( href.indexOf('/picassoRedirect.html' ) == -1 )
		{
			return href;
		}
		let start = href.indexOf('https%3A%2F%2F');
		let end   =href.indexOf('&qualifier');

		let realUrl = decodeURIComponent( href.substr( start , end-start ) ).replace(/\+/g,' ');
		return realUrl;
	}

	getSearchTerms( url )
	{
		let parameters	= this.getParameters( url );
		let search		= [];
		let paramKeys	= ['field-keywords'];

		paramKeys.forEach((key)=>
		{
			if( key in parameters )
			{
				if( Array.isArray( parameters[ key ] ) )
				{
					parameters[key].forEach((value)=>{ search.push( value.trim() ); });
				}
				else
				{
					search.push( parameters[ key ].trim() );
				}
			}
		});

		return search;
	}

	getProductsFromCart()
	{
		let form = document.querySelector('#activeCartViewForm');

		let itemsNodeList = form.querySelectorAll('.sc-list-body[data-name="Active Items"]');
		let items	= Array.from( itemsNodeList );

		let productsArray	= [];
		let date		= new Date();

		items.forEach((i)=>
		{
			let asinContainer	= i.querySelector('div[data-asin]');
			if( !asinContainer )
				return;

			let product		= {

			};
			product.asin	= asinContainer.getAttribute('data-asin');
			product.parsed	= date.toISOString();
			product.parsedDates	=[ this.getDateString( date ) ];

			let link	= i.querySelector('a.sc-product-link');

			let params  = {};

			if( link )
			{
				product.url	= link.getAttribute('href');
				params	= this.getParameters( product.url );
			}


			let seller	= i.querySelector('.sc-seller a');

			if( seller )
				product.sellers = [ seller.textContent.trim().toLowerCase() ];

			let qtyStr 	= this.getValueSelector(i,'.sc-product-scarcity');

			if( qtyStr && /^Only (\d+) left in stock/.test( qtyStr ) )
			{
				let stock	= {
					qty	: qtyStr.replace(/^only (\d+) left in stock.*$/i,'$1')
					,date	: this.getDateString( date )
					,time	: date.toISOString()
				};

				if( 'seller' in product )
				{
					stock.seller		= product.sellers[0];
					stock.seller_url	= seller.getAttribute('href');
				}

				if( 'smid' in params )
				{
					stock.seller_id		= params.smid;
				}

				product.stock = [ stock ];
			}

			let price = this.getValueSelector(i,'span.sc-product-price');

			if( price )
			{
				let offer = {
					price	: price
					,date	: this.getDateString( date )
					,time	: date.toISOString()
				};

				if( 'seller' in product )
				{
					offer.seller		= product.seller;
					offer.seller_url	= seller.getAttribute('href');
				}

				product.offers = [ offer ];
			}
			productsArray.push( product );
		});

		return productsArray;
	}

	getDateString( date )
	{
		let fl = (i)=> i<10 ? '0'+i : i;
		let dateStr = date.getFullYear()+'-'+fl( date.getMonth()+1 )+'-'+fl( date.getDate() );

		return dateStr;
	}

	getProductFromSellersPage()
	{
		let product = {
			sellers : []
		};

		let name = document.querySelector('#olpProductDetails h1');

		if( name )
			product.title = name.textContent.trim();

		let producer = document.querySelector('#olpProductByline');

		if( producer && /^by /.test( producer.textContent.trim() ) )
			product.producer = producer.textContent.trim().replace(/^by /,'').toLowerCase();

		let date		= new Date();
		product.parsed	= date.toISOString();
		product.parsedDates	=[ this.getDateString( date ) ];
		product.asin		= this.getAsinFromUrl( window.location.href );

		let divs = document.querySelectorAll('#olpOfferList div[role="row"].olpOffer');
		let da	= Array.from( divs );

		let offers	= [];


		da.forEach((div)=>
		{
			let seller = div.querySelector('.olpSellerName span>a');
			if( seller )
			{
				let offer = {
					price	:this.getValueSelector(div,'span.olpOfferPrice.a-text-bold')
					,seller	: seller.textContent
					,shipping	: this.getValueSelector( div,'.olpShippingInfo')
					,condition	: this.getValueSelector(div,'.olpCondition')
					,seller_url	: seller.getAttribute('href')
					,time		: product.parsed
				};

				let prime = div.querySelector('[aria-label="Amazon Prime TM"]');

				if( prime )
					offer.is_prime = true;

				product.sellers.push( seller.textContent.trim().toLowerCase() );

				offers.push( offer );
			}
		});

		product.offers = offers;
		return product;
	}
}
