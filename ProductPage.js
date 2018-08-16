class ProductPage
{
	constructor(amazonParser, productUtils )
	{
		this.amazonParser = amazonParser;
		this.productUtils = productUtils;
	}

	getProduct()
	{
		let p1 = this.getProductFromProductPage();
		let p2 = this.getProductFromBuyBox();
		let p = null;

		if( p1 && p2 )
		{
			p = this.productUtils.mergeProducts( p1, p2 );
		}
		else if( p1 )
		{
			p = p1;
		}
		else if( p2 )
		{
			p = p2;
		}

		return p;
	}

	getProductFromProductPage()
	{
		// jshint shadow: true
		let product 		= this.productUtils.createNewProductObject();

		this.amazonParser.getSearchTerms( window.location.search ).forEach((term)=>
		{
			product.search.push( term );
		});

		let version	= this.amazonParser.getVersionLambda('getProductFromProductPage');

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

		let seller = document.querySelector('#shipsFromSoldBy_feature_div a');
		let seller_id = '';
		let vendor_name	= '';

		if( seller && /\/gp\/help\/seller\//.test( seller.getAttribute('href') ) )
		{
			vendor_name = seller.textContent.trim();
			let sellerParams = this.amazonParser.getParameters( seller.getAttribute('href') );
			console.log('Params', sellerParams );

			if( 'seller' in sellerParams )
			{
				seller_id = sellerParams.seller;
				product.seller_ids.push( seller_id );
			}
		}

		if( vendor_name )
			product.sellers.push( vendor_name.toLowerCase() );

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
					product.left = text.textContent.trim();
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
						product.left = text.textContent.trim();
						version( product ,'left', 6, product.left);
					}

					if( /Currently unavailable./i.test( text ) )
					{
						product.left = 'Currently unavailable.';
						version( product ,'left', 7, product.left);
					}

					if( /in stock on [A-Za-z]+ \d{1,2} 20\d{2}/i.test( text ) )
					{
						product.left = text.textContent.trim();
						version( product ,'left', 8, product.left);
					}
				}
			}
		}

		if( product.left )
		{
			let d = new Date();
			let stock = {
				date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
				,qty	: product.left
			};

			if( vendor_name )
				stock.seller = vendor_name;

			if( seller_id )
				stock.seller_id = seller_id;

			product.stock.push( stock );
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
					version( product ,'choice', 1, product.choice );
					break;
				}
			}
		}

		product.asin	= this.amazonParser.getAsinFromUrl( window.location.href );

		if( product.asin )
		{
			version( product, 'ASIN',1 ,product.asin );
		}

		var sale = document.getElementById('priceblock_saleprice_row #priceblock_saleprice');
		let offer	= {};
		if( vendor_name )
			offer.seller = vendor_name;

		if( seller_id )
		{
			offer.seller_id = seller_id;
		}

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

		let shipping = document.querySelector('#ourprice_shippingmessage>span>b');

		if( shipping )
		{
			version( product ,'shipping', 3, offer.shipping );
			offer.shipping =  shipping.textContent;
		}

		let prime = document.querySelector('#priceblock_ourprice_row i.a-icon.a-icon-prime');

		if( prime )
		{
			offer.is_prime = true;
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
			//		 prating.getAttribute('title').trim().replace(/.*(\d+(\.\d+)?) out of \d+ stars.*/,'$1');
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
			if( product.number_of_ratings === 'Be the first to review this product' || product.number_of_ratings.includes('Be the first to review this item') )
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

	getProductFromBuyBox()
	{
		let product = null;
		var box = document.querySelector('#desktop_buybox');

		if( box )
		{
			product = this.productUtils.createNewProductObject();
			product.asin = this.amazonParser.getValueSelector(box,'input[name="ASIN"]');

			let shipFromSold	= this.amazonParser.getValueSelector( box, '#merchant-info');

			//let shipTextx		= '';
			let vendor_name	= '';

			let soldByThirdParty = this.amazonParser.getValueSelector( box,'#soldByThirdParty');

			if( soldByThirdParty && /Sold by/.test( soldByThirdParty ) )
			{
				vendor_name = soldByThirdParty.replace(/.*Sold by /,'');
			}

			let fullfilled_by = '';

			if( /ships from and sold by Amazon.com/i.test( shipFromSold ) )
			{
				fullfilled_by	= 'AMAZON';
				vendor_name		= 'Amazon.com';
				product.sellers.push( 'amazon.com');
			}

			let offer = {
				rsid			: this.amazonParser.getValueSelector( box, 'input[name="rsid"]')
				,price			: this.amazonParser.getValueSelector( box, '#price_inside_buybox' )
				,seller_id		: this.amazonParser.getValueSelector( box, 'input[name="merchantID"]')
				,shipping		: this.amazonParser.getValueSelector( box, '#price-shipping-message')
				,vendor_name	: vendor_name
				,fullfilled_by	: fullfilled_by
			};

			product.offers = [ offer ];
		}

		return product;
	}

	followPageProductOffers()
	{
		var asin =  this.amazonParser.getAsinFromUrl( window.location.href );
		var a = document.querySelectorAll('a');

		for(var i=0;i<a.length;i++)
		{
			var href = a[ i ].getAttribute('href');
			if( href && href.includes('/gp/offer-listing/'+asin) )
			{
				//console.log('Clicked');
				a[ i ].click();
				return;
			}
		}
	}
}