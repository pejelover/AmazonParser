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
		var version = this.getVersionLambda('getVendorInfoFromVendorInfoPage');
	}

	/*
	*/

	getProductsFromVendorInfoPageSectionProducts()
	{
		var pArray		= [];
		var version		= this.getVersionLambda('VendorProductSectionParser');
		var products	= document.queryAll('#products-results-data  .product-details');

		for(var i=0;i<products.length;i++)
		{
			var p = {};
			p.versions = [];

			version(p,'extracted',1,window.location.href);


			var ptitle = products[i].querySelector('.product-title a[title]');

			if( ptitle )
			{
				p.title = ptitle.getAttribute('title');
				version(p,'title',1, p.title);

				p.url 	= ptitle.getAttribute('href');
				version(p,'url',1 ,p.url );
			}

			var prating = products[i].querySelector('.product-rating a[title]');

			if( prating )
			{
				p.rating = prating.getAttribute('title');
				version(p,'rating',1, p.rating );
			}


			var nrating = products[i].querySelector('.product-rating:not([title])');
			if( nrating  )
			{
				p.number_of_ratings = nrating.textContent.trim();
				version(p,'no_rating',1, p.number_of_ratings);
			}


			var pprice = products[i].querySelector('.product-price');

			if( pprice )
			{
				p.price = pprice.textContent.trim();
				version(p,'no_price',1, p.price );
			}

			pArray.push( p );
		}

		return pArray;
	}

	getProductFromProductPage()
	{
		// jshint shadow: true
		var p 		= {};
		p.versions	= [];
		p.images 	=[];
		var version		= this.getVersionLambda('getProductFromProductPage');

		p.url 	= window.location.href;
		p.dateParsed	= new Date().toLocaleString('en-US', { hour12: false });

		version( p,'extracted',1,window.location.href );

		var description 	= document.querySelector('#productDescription>p');

		if( description )
		{
			p.description	= description.textContent.trim();
			version( p , 'description', 1, p.description );
		}


		var productTitle	= document.getElementById('productTitle');

		if( productTitle )
		{
			p.title = productTitle.textContent.trim();
			version( p , 'title', 1, p.title );
		}

		var producer 	= document.querySelector('#bylineInfo_feature_div a');

		p.producer = "";

		if( producer )
		{
			p.producer		= producer.textContent.trim();
			p.producer_url	= producer.getAttribute('href');
			version( p , 'producer', 1, p.producer );
		}

		//Tes with
		//https://www.amazon.com/dp/B01HDNSF3K/ref=sxr_pa_click_within_right_3?pf_rd_m=&pf_rd_p=&pf_rd_r=&pd_rd_wg=5I2b0&pf_rd_s=desktop-rhs-carousels&pf_rd_t=301&pd_rd_w=ykYhM&pf_rd_i=lenovo+amd+laptop&pd_rd_r=&psc=1
		if( producer && p.producer === "" )
		{
			var href = producer.getAttribute('href');
			p.producer = href.substring(1, href.indexOf('/',1) );
			version( p , 'producer', 2, p.producer );
		}

		if( p.producer === "" )
		{
			producer = document.querySelector('#brandBylineWrapper #brand');
			if( producer )
			{
				p.producer = producer.textContent.trim();
				version( p , 'producer', 3, p.producer );
			}

		}

		if( p.producer === "" )
		{
			let brand = document.querySelector('#brand');
			if( brand )
			{
				p.producer = brand.textContent.trim();
				version( p , 'producer', 4, p.producer );
			}
		}

		if( p.producer === "" )
		{
			let brand = document.querySelector('.author.notFaded');
			if( brand )
			{
				p.producer = brand.textContent.trim();
				version( p , 'producer', 5, p.producer );
			}
		}

		if( p.producer === "" )
		{
			let brand = document.querySelector('#bylineInfo');
			if( brand )
			{
				p.producer = brand.textContent.trim();
				version( p , 'producer', 6, p.producer );
			}
		}



		var lefts	= document.querySelectorAll('span.a-size-medium.a-color-price');
		if( lefts )
		{
			var plefts	= Array.from( lefts );
			p.left		= '';

			//"Only 6 left in stock - order soon."
			//
			for(let i=0;i<plefts.length;i++)
			{
				if( /only \d+ left in stock/i.test( plefts[ i ].textContent ) )
				{
					p.left = plefts[ i ].textContent.trim();
					version( p ,'left', 1, p.left);
					break;
				}
				if( /Currently unavailable./i.test( plefts[ i ].textContent ) )
				{
					p.left = 'Currently unavailable.';
					version( p ,'left', 2, p.left);
					break;
				}
			}
		}

		if( typeof p.left  === "undefined" || p.left === '' )
		{
			let availability = document.querySelectorAll('[data-feature-name="availability"]');

			for( let i = 0; i<availability.length;i++)
			{
				let text = availability[ i ].textContent.replace(/\s+/gm,' ').trim();
				if( text == 'In Stock.' )
				{
					p.left	= 'In Stock.';
					version( p ,'left', 3, p.left);
					break;
				}

				if( /Available from these sellers./i.test( text ) )
				{
					p.left = 'Available from other sellers';
					version( p ,'left', 4, p.left);
					break;
				}

				if( /in stock on [A-Za-z]+ \d{1,2} 20\d{2}/i.test( text ) )
				{
					p.left = plefts[ i ].textContent.trim();
					version( p ,'left', 5, p.left);
				}
			}
		}

		if( typeof p.left  === "undefined" || p.left === '' )
		{
			let availability = document.getElementById('availabilityInsideBuyBox_feature_div');

			if( availability )
			{
				let textContainer = availability.querySelector('#availability');
				let text = textContainer.textContent.trim();

				if( /only \d+ left in stock/i.test( text ) )
				{
					p.left = plefts[ i ].textContent.trim();
					version( p ,'left', 6, p.left);
					break;
				}



				if( /Currently unavailable./i.test( text ) )
				{
					p.left = 'Currently unavailable.';
					version( p ,'left', 7, p.left);
					break;
				}

				if( /in stock on [A-Za-z]+ \d{1,2} 20\d{2}/i.test( text ) )
				{
					p.left = plefts[ i ].textContent.trim();
					version( p ,'left', 8, p.left);
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
					p.choice	= text.substring( index );
					version( p ,'choice', 1, p.left);
					break;
				}
			}
		}

		p.asin	= this.getAsinFromUrl();

		if( p.asin )
		{
			version( p, 'ASIN',1 ,p.asin );
		}

		var sale = document.getElementById('priceblock_saleprice_row #priceblock_saleprice');
		if( sale )
		{
			//Sael v4
			p.sale 	 = sale.textContent.trim();
			version( p ,'sale', 4, p.sale );
		}
		if( sale )
		{
			//sale V1
			p.sale 	 = sale.textContent.replace(/Sale:/g,'').trim();
			version( p ,'sale', 1, p.sale );
		}
		else if( (sale = document.querySelector('#price span.a-size-medium.a-color-price')) )
		{
			//sale V2
			p.sale = sale.textContent.trim();
			version( p ,'sale', 2, p.sale );
		}
		else if( ( sale = document.querySelector('div.a-section>span.a-size-large.a-color-price') ) )
		{
			//sale V3
			p.sale = sale.textContent.trim();
			version( p ,'sale', 3, p.sale );
		}
		else if( (sale = document.querySelector('div#formats div#tmmSwatches li a>span:last-child') ) )
		{
			let toSearch	= 'from $';
			let index		=  sale.textContent.trim().indexOf( toSearch );
			p.sale			= '';

			if( index > -1 )
			{
				p.sale = sale.textContent.trim().substring( index+toSearch.length );
			}
			version( p ,'sale', 4, p.sale );
		}


		//Shipping
		//
		let shipping = document.querySelector('#priceblock_ourprice_row #ourprice_shippingmessage b');

		if( shipping )
		{
			version( p ,'shipping', 3, p.shipping );
			p.shipping =  shipping.textContent;
		}

		if( typeof p.shipping === "undefined" )
		{

			shipping = document.querySelector('a.cfs-free-shipping');

			if( shipping )
			{
				p.shipping = shipping.textContent.trim();
				version( p ,'shipping', 1, p.shipping );
			}
		}


		if( typeof p.shipping === "undefined" )
		{
			shipping = document.querySelector('#priceblock_ourprice_row');
			if( shipping )
			{
				p.shipping = shipping.textContent.trim().replace(/\n/g,' ').replace(/.*(\$\d+(\.\d+)? shipping).*/,'$1');
				version( p ,'shipping', 2, p.price );
			}
		}

		var fullfilled = document.querySelector('#merchant-info');

		if( fullfilled )
		{
			p.fullfilled_by = fullfilled.textContent.trim().toLowerCase().includes('fulfilled by amazon') ? 'AMAZON':'';
			version( p ,'fullfilled', 1, p.fullfilled_by );
		}
		if(fullfilled && p.fullfilled_by === '' )
		{
			p.fullfilled_by = fullfilled.textContent.trim().toLowerCase().includes('ships from and sold by') ? 'VENDOR':'';
			version( p ,'fullfilled', 2, p.fullfilled_by );
		}




		//Especs
		p.spec= {};

		var specTable = document.querySelectorAll('[id="product-specification-table"]');
		if( specTable.length )
		{
			for(var j=0;j<specTable.length;j++)
			{
				var tr = specTable[j].querySelectorAll('tr');

				for(var k=0;k<tr.length;k++)
				{
					var th = tr[k].querySelector('th');
					var td = tr[k].querySelector('td');
					p.spec[ th.textContent.trim().replace(/:$/,'') ] = td.textContent.trim();
				}
			}

			//V1
			version( p ,'specs', 1, '' );
		}

		var technical_specs = document.querySelectorAll('#technicalSpecifications_section_1 tr');

		if( technical_specs.length )
		{
			for(var i=0;i<technical_specs.length;i++)
			{
				var tr = technical_specs[i];
				var key = tr.querySelector('th').textContent.trim().replace(/:$/,'');
				var value = tr.querySelector('td').textContent.trim();
				p.spec[ key ] = value;
			}

			//V2
			version( p ,'specs', 2 , '');
		}

		//Features
		var features = document.querySelectorAll('#feature-bullets-btf .bucket.normal li');
		p.features = [];

		if( features.length )
		{
			for(var i=0;i<features.length;i++)
			{
				p.features.push(features[ i ].textContent.trim() );
			}

			//V1
			version( p ,'features', 1, '' );
		}

		features = document.querySelectorAll('#featurebullets_feature_div li:not(.aok-hidden)');

		if( features )
		{
			for(var i=0;i<features.length;i++)
			{
				p.features.push(features[ i ].textContent.trim() );
			}
			//V2
			version( p ,'features', 2, '' );
		}

		//Details
		p.productDetails	= {};

		var details = document.querySelectorAll('#productDetailsTable .content li');

		if( details.length )
		{
			for(var i=0;i<details.length;i++)
			{
				var detail = details[i].querySelector('b').textContent.trim().replace(/:$/,'');
				var fullDetail = details[i].textContent.replace( detail, '');
				p.productDetails[ detail.trim() ] = fullDetail.trim();
				//V1
			}
			version( p ,'details', 1, '' );
		}

		details = document.querySelectorAll('#productDetails_detailBullets_sections1 tr');

		if( details.length )
		{
			for(var i=0;i<details.length;i++)
			{
				var detail					= details[ i ].querySelector('th').textContent.trim().replace(/:$/,'');
				var fullDetail2 			= details[ i ].querySelector('td').textContent;
				p.productDetails[ detail ]	= fullDetail2.trim();
			}
			//V2
			version( p ,'details', 2, '' );
		}

		var details = document.querySelectorAll('#prodDetails table tr');

		if( details.length )
		{
			for(var i=0;i<details.length;i++)
			{
				var label = details[i].querySelector('.label');
				var value = details[i].querySelector('.value');

				if( label && value )
				{
					p.productDetails[ label.textContent.trim().replace(/:$/,'') ] = value.textContent.trim();
				}
			}
			//V3
			version( p ,'details', 3, '' );
		}

		var prating = document.querySelector('#averageCustomerReviews_feature_div #acrPopover');
		if( prating )
		{
			///^-?\d*(\.\d+)?$/
			p.rating = prating.getAttribute('title').trim().replace(/(\d+(\.\d+)?) out of \d+ stars.*/,'$1');
			//         prating.getAttribute('title').trim().replace(/.*(\d+(\.\d+)?) out of \d+ stars.*/,'$1');
			version(p,'rating',1, p.rating );
		}

		var nrating = document.querySelector('#averageCustomerReviews_feature_div #acrCustomerReviewLink');
		if( nrating )
		{
			p.number_of_ratings = nrating.textContent.trim().replace(/(\d+).*/,'$1');
			version(p,'no_rating',1, p.number_of_ratings);
		}


		if( typeof p.number_of_ratings === "undefined" && typeof p.productDetails['Customer Reviews'] !== "undefined")
		{
			var rating_text = p.productDetails['Customer Reviews'].replace(/.*(\d+) out of \d+ stars.*/,'$1');
			var no_ratings	=  p.productDetails['Customer Reviews'].replace(/.*(\d+) customer reviews.*/,'$1');

			if( rating_text )
			{
				p.rating = rating_text;
				version(p,'rating',2, p.rating );
			}

			if( no_ratings )
			{
				p.number_of_ratings = no_ratings;
				version(p,'no_rating',2, p.rating );
			}
		}

		//Cleaning ratings
		if( typeof p.number_of_ratings !== "undefined" )
		{
			if( p.number_of_ratings === 'Be the first to review this product'
				|| p.number_of_ratings.includes("Be the first to review this item") )
			p.number_of_ratings = '0';
		}


		//if( typeof p.productDetails['Average Customer Review:'] )
		//	delete p.productDetails['Average Customer Review:'];

		//Images
		var imagesElement	= document.querySelector('#imageBlock_feature_div');

		if( imagesElement )
		{
			var images = imagesElement.innerHTML;
			var data	= images.indexOf("var data = {");
			var sub1	= images.substring( data+10 );
			var data2   = sub1.indexOf('};')+1;
			var data3   = sub1.substring(0,data2).replace(/'/g,'"');

			var z		= JSON.parse( data3 );

			for(var i=0;i<z.colorImages.initial.length;i++)
			{
				if( z.colorImages.initial[i].hiRes );
					p.images.push( z.colorImages.initial[i].hiRes );
			}

			version( p ,'images', 1, '' );
		}

		imagesElement = document.querySelector('img#miniATF_image.a-dynamic-image.miniATFImage');

		if( imagesElement )
		{
			var imgSr = imagesElement.getAttribute('src');
			if( imgSr )
				p.images.push( imgSr );

			version( p ,'images', 2, '' );
		}


		//Vendors
		var vendors = document.querySelectorAll('#moreBuyingChoices_feature_div .pa_mbc_on_amazon_offer span[data-a-popover]');

		if( vendors.length )
		{
			p.vendors = [];

			for(var i=0;i<vendors.length;i++)
			{
				try
				{
					this.log( vendors[i].getAttribute('data-a-popover') );

					var obj = JSON.parse( vendors[i].getAttribute('data-a-popover') );

					if( typeof obj.url !== "undefined" )
					{
						p.vendors.push(  obj.url  );
					}
				}
				catch(e)
				{
					this.log('IGNORE:',e );
				}
			}

			version( p ,'vendors', 1, '' );
		}


		//Other Vendors
		var otherVendors = document.querySelectorAll('#olp_feature_div a');

		if( otherVendors.length )
		{
			p.no_offers_url = otherVendors[0].getAttribute('href');
			p.no_offers = otherVendors[0].textContent.replace(/.*\((\d+)\).*/g,'$1');
			p.no_offers_text = otherVendors[0].textContent.trim();
			version( p ,'no_offers', 1, '' );
		}



		//Ratings

		return p;
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
				var asin 	= li.getAttribute('data-defaultasin');
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

	parseOtherVendors()
	{
		var asin	= this.getAsinFromUrl();
		var a		= document.querySelectorAll('#olpOfferList h3.olpSellerName a');
		this.log('Vendor url match',asin);


		var rows = document.querySelectorAll('#olpOfferList div.olpOffer');

		var priceColumn	= document.querySelectorAll('a-column a-span2 olpPriceColumn');

		var productVendors	= {
			asin		: asin
			,vendors	: []
		};

		for(let i=0;i<rows.length;i++)
		{

			let objRow		= {};
			let row			= rows[i];

			let amazon		= row.querySelector('.olpSellerColumn img[alt="Amazon.com"]');

			if( amazon )
			{
				objRow.sellerName = 'Amazon.com';
			}
			else
			{
				objRow.sellerName	= row.querySelector('h3.olpSellerName a').textContent;
			}


            var price           = row.querySelector('.olpOfferPrice');

            if( price )
			    objRow.price		= row.querySelector('.olpOfferPrice').textContent.trim();

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
		}

		return Promise.resolve( productVendors );
	}

	getVersionLambda( func_name )
	{
		return ( p, name, version, value )=>
		{
			p.versions.push({attr: name, func:func_name, version: version});
		};
	}

	getAsinFromUrl( url )
	{
		var asin	= url.replace(/.*\/dp\/(\w+)(:?\/|\?).*/,'$1');

		if( asin.includes('https://' ) )
		{
			asin = url.replace(/^.*\/gp\/offer-listing\/(\w+)\/.*/,'$1');
		}

		if( asin.includes('https://') )
		{
			asin = url.replace(/^.*\gp\/product\/(\w+).*$/,'$1');
		}

		if( asin.includes('https://') )
		{
			asin = url.replace(/.*\/dp\/(\w+)$/,'$1');
		}

		return asin;
	}

	getPageType( href )
	{

		if( /\/gp\/huc\/view.html\?.*newItems=.*$/.test( href ) )
			return 'PREVIOUS_TO_CART_PAGE';

		if( /^https:\/\/www.amazon.com\/gp\/offer-listing.*/.test( href ) )
			return 'VENDORS_PAGE';

		if( /^https:\/\/www.amazon.com\/(?:.*)?dp\/(\w+)(?:\?|\/)?.*$/.test( href ) )
			return 'PRODUCT_PAGE';

		if( /&field-keywords=\w+/.test( href ) )
			return 'SEARCH_PAGE';

		if( /amazon\..*\/gp\/cart\/view.html/.test( href ) )
			return 'CART_PAGE';
	}
}
