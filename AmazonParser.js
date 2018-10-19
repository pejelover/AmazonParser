class AmazonParser
{
	constructor(options)
	{
		this.productUtils	= new ProductUtils( options );
		this.productPage	= new ProductPage( this, this.productUtils );
		this.productSellersPage	= new ProductSellersPage( this, this.productUtils );
		this.cartPage	= new CartPage( this, this.productUtils );
		this.prev2cart =  new Prev2Cart( this );
		this.merchantProductsPage = new MerchantProducts( this );

		this.debug		= false;
	}

	/*
		Parses the vendor section of
	*/

	log( ...args )
	{
		if( this.debug  )
		{
			let args = Array.from( arguments );
			console.log.apply( console, args );
			//console.log( args );
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

		let map = new Map();

		let start 	= url.indexOf('?');
		let end 	=  url.indexOf('#');

		if( start === -1 )
			return map;

		let x = url.substring(start+1, end == -1 ? url.length : end  );

		let finalString = x;
		if( finalString.indexOf('?') === 0 )
		{
			finalString = finalString.substring( 1, finalString.length-1 );
		}

		let parametersArray	= finalString.split('&');

		//let obj = {};

		for(let i=0;i<parametersArray.length;i++)
		{
			let s = parametersArray[i].split('=');

			if( s.length > 1 )
			{
				let value = decodeURIComponent( s[ 1 ] ).replace(/\+/g,' ');

				if( map.has( s[0] ) )
				{
					let mapValue = map.get( s[0] );

					if( Array.isArray( mapValue ) )
					{
						mapValue.push( s[0] );
					}
					else
					{
						let array = [ mapValue ];
						array.push( value );
						map.set( s[0], array );
					}

					//if( Array.isArray( obj[ s[0] ] ) )
					//	obj[ s[0] ].push(  value  );
					//else
					//	obj[ s[0] ] = [ obj[s[0] ], value ];
				}
				else
				{
					map.set( s[0], value );
					//obj[ s[0] ] = value;
				}
			}
		}
		return map;
	}

	getProductsFromVendorInfoPageSectionProducts()
	{
		let version		= this.getVersionLambda('VendorProductSectionParser');
		let productsArray	= document.querySelectorAll('#products-results-data  .product-details');
		let products		= [];

		for(var i=0;i<productsArray.length;i++)
		{
			let product = this.productUtils.createNewProductObject();

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

			products.push( product );
		}

		return productsArray;
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

			var shipping		= row.querySelector('.olpShippingInfo');
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



	getAsinFromUrl( a )
	{
		let url = a === undefined ? window.location.href : a ;

		var asin	= url.replace(/.*\/dp\/(\w+)(:?\/|\?).*/,'$1');

		if( asin.includes('https://' ) )
		{
			asin = url.replace(/^.*\/gp\/offer-listing\/(\w+)\/?.*/,'$1');
		}

		if( asin.includes('https://') )
		{
			asin = url.replace(/^.*\/gp\/product\/(\w+).*$/,'$1');
		}

		if( asin.includes('https://') )
		{
			asin = url.replace(/.*\/dp\/(\w+)$/,'$1');
		}

		 if( asin.includes('/gp/aag/main' ) )
    	{
    	    asin  = url.replace(/\/gp\/aag\/main\/ref=olp_merch_name_\d+\?ie=UTF8&asin=(\w+)&.*/,'$1');
    	}

		if( /^\//.test( asin ) )
			return null;

		if( /^https/.test( asin ) )
			return null;

		return asin;
	}

	getPageType( href )
	{
		let cleanUrl  = this.cleanPicassoRedirect( href );
		if( cleanUrl.indexOf('http') == 0 )
		{
			if( cleanUrl.indexOf('https') == 0  )
				cleanUrl = 'https://'+cleanUrl.substring( 8 ).replace(/\/+/g,'/');
			else
				cleanUrl = 'http://'+cleanUrl.substring( 7 ).replace(/\/+/g,'/');
		}
		else
		{
				cleanUrl = cleanUrl.replace(/\/+/g,'/');
		}



		if( /\/gp\/huc\/view.html\?.*newItems=.*$/.test( cleanUrl ) )
			return 'PREVIOUS_TO_CART_PAGE';

		if( /^https:\/\/www.amazon.com\/gp\/offer-listing.*/.test( cleanUrl ) )
			return 'VENDORS_PAGE';

		if( /https:\/\/wwww.amazon.com\/s/.test( cleanUrl  ) )
		{
			let params = this.getParameters( href );
			if( params.has( 'marketplaceID') && params.has('merchant') )
			{
				return 'MERCHANT_PRODUCTS';
			}
		}

		if( /marketplaceID=(\w+)&/.test( cleanUrl ) || /\/s\?/.test( href ) )
		{
			return 'MERCHANT_PRODUCTS';
		}


		// /^https:\/\/www.amazon.com\/(?:.*)?dp\/(\w+)(?:\?|\/)?.*$/ Works on firefox Fails in Chrome
		//
		if( /^https:\/\/www.amazon.com\/gp\/product\/handle-buy-box\//.test( cleanUrl ) )
		{
			return 'HANDLE_BUY_BOX';
		}

		//https://www.amazon.com/Chosen-Foods-Propellant-Free-Pressure-High-Heat/dp/B01NBHW921/ref=sr_1_3_a_it?s=office-products&ie=UTF8&qid=1533084933&sr=8-3&keywords=Choosen%2BFoods&th=1
		if( /^\/gp\/product\/w+/.test( cleanUrl ) || /^https:\/\/www.amazon.com\/(?:.*)?dp\/(\w+)(?:\?|\/)?.*$/.test( cleanUrl ) ||
			(/^https:\/\/www.amazon.com\/gp\/product\/(\w+)(?:\?|\/)?.*$.*/.test( cleanUrl ) && !( /amazon\.com\/gp\/product\/handle-buy-box/.test( cleanUrl ) ) ) )
			return 'PRODUCT_PAGE';

		//https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias=aps
		//if( /\/s\/ref=nb_sb_noss_2.url=search-alias.3Daps/.test( href ) )


		if( /^https:\/\/www.amazon.com\/gp\/search/.test( cleanUrl )
			|| /^https:\/\/www.amazon.com\/s\//.test( cleanUrl )
			|| /&field-keywords=\w+/.test( cleanUrl )
			|| /\/s\/ref=sr_pg_\d+\?/.test( cleanUrl ) )
			return 'SEARCH_PAGE';

		if( /amazon\..*\/gp\/cart\/view.html/.test( cleanUrl ) || /\/gp\/item-dispatch\/ref=/.test( cleanUrl ) )
			return 'CART_PAGE';

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

	getSearchListSelector( count )
	{
		let counter = 15;

		if( count )
			counter = count;

		return '#resultsCol li[data-asin]:nth-child('+counter+'),#s-results-list-atf li[data-asin]:nth-child('+counter+')';
	}

	parseProductSearchList()
	{
		let parameters	= this.getParameters( window.location.search );
		let search		= [];

		let s = document.querySelectorAll('#s-results-list-atf li[data-asin]');
		let items = Array.from( s );
		let productsArray = [];

		items.forEach(( i)=>
		{
			let product = this.productUtils.createNewProductObject();

			let a	  = i.querySelector('a.s-access-detail-page');

			if( a == null )
				return;

			product.asin = i.getAttribute('data-asin');

			let title = a.getAttribute('title');

			if( !title )
				return;

			product.title = title.replace(/^\[Sponsored\](.*)$/,'$1');

			let url	= this.cleanPicassoRedirect( a.getAttribute('href') );
			product.url = url;

			//let parameters = this.getParameters( url );

			let producer_name = '';

			let pn_selectors =
			{
				'div>div:nth-child(5)>div:nth-child(2)>span:nth-child(1)':'div>div:nth-child(5)>div:nth-child(2)>span:nth-child(2)'
				,'div>div:nth-child(3)>div:nth-child(2)>span:nth-child(1)':'div > div:nth-child(3) > div:nth-child(2) > span:nth-child(2)'
				,'div>div>div>div.a-fixed-left-grid-col.a-col-right>div.a-row.a-spacing-small>div:nth-child(2)>span:nth-child(1)':'div>div>div>div.a-fixed-left-grid-col.a-col-right>div.a-row.a-spacing-small>div:nth-child(2)>span:nth-child(2)'
			};

			let keys = Object.keys( pn_selectors );

			for(let j=0;j<keys.length;j++ )
			{
				let key = keys[ j ];

				if( this.getValueSelector( i, key ) == 'by' )
				{
					producer_name = this.getValueSelector(i, pn_selectors[ key ] );
					break;
				}
			}

			////let producer_name =  this.getValueSelector(i,'.a-row.a-spacing-small > .a-row.a-spacing-none:last-of-type');
			//let producer_name =  this.getValueSelector(i,'.a-row.a-spacing-mini > .a-row.a-spacing-none:last-of-type');

			product.producer = producer_name ? producer_name.trim() : '';

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
					,date			: this.productUtils.getDate()
					,time			: this.productUtils.getTime()
				};


				if( isPrime )
					offer.is_prime = true;

				product.offers.push( offer );

				offers.push( offer );
			});

			let text = i.textContent.replace(/\s+/gm,' ');

			if( /only \d+ left in stock/i.test( text ) )
			{
				let href = i.querySelector('a.s-access-detail-page');

				product.stock.push({
					qty		: text.replace(/^Only (\d+) left in stock.*/,'$1' )
					,url	: this.cleanPicassoRedirect( href.getAttribute('href') )
					,date	: this.productUtils.getDate()
					,time	: this.productUtils.getTime()
				});
			}

			if( product.offers.length && product.asin )
			{
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

		items.forEach((i)=>
		{
			let product	= this.productUtils.createNewProductObject();

			let a = i.querySelector('div > div:nth-child(3) > div:nth-child(1) > a[title]');

			if( !a )
				return;

			product.title	= a.getAttribute('title');
			product.asin	= i.getAttribute('asin');
			product.link	= a.getAttribute('href');

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
		let paramKeys	= ['field-keywords'];
		let search = [];

		paramKeys.forEach((key)=>
		{
			if( parameters.has( key ) )
			{
				if( Array.isArray( parameters.get( key ) ) )
				{
					parameters.get( key ).forEach((value)=>{ search.push( value.trim() ); });
				}
				else
				{
					search.push( parameters.get( key ).trim() );
				}
			}
		});

		return search;
	}

	getAllProductOffers()
	{

	}

	getUrlObject( url )
	{
		let urlObj = {};
		urlObj.time = this.productUtils.getTime();

		let href = this.cleanPicassoRedirect( url );

		if( href.indexOf('https://') == -1  )
		{
			urlObj.url = 'https://www.amazon.com'+url;
		}

		let params	= this.getParameters( urlObj.url );
		let asin	= this.getAsinFromUrl( urlObj.url );

		if( asin !== null )
		{
			urlObj.asin = asin;
		}

		urlObj.type	= this.getPageType( href );

		if( params.has('m') )
		{
			urlObj.seller_id = params.get('m');
		}
		else if( params.has('smid') )
		{
			urlObj.seller_id = params.get('smid');
		}
		else if( params.has('s') )
		{
			urlObj.s  = params.get('s');
		}
		else if( params.has('merchant') )
		{
			urlObj.merchant = params.get('merchant');
		}
	}

	getAllLinks()
	{
		let linkElements = document.querySelectorAll('a');
		let allLinks = Array.from( linkElements );

		let pLinks = [];
		allLinks.forEach(( link )=>
		{
			let href	= link.getAttribute('href');
			if( !href )
				return;

			let urlObj = this.getUrlObject( href );

			pLinks.push( urlObj );
		});

		return pLinks;
	}
}


try{
	if( typeof module !== "undefined" && module.exports )
	{
		module.exports = AmazonParser;
	}
}
catch(e){


}

