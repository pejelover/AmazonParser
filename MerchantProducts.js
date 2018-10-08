class MerchantProducts
{
	constructor( amazonParser )
	{
		this.amazonParser 	= amazonParser;
		this.productUtils	= amazonParser.productUtils;
	}

	parseProduct( container )
	{
		let product = this.productUtils.createNewProductObject();

		let a	  = container.querySelector('a.s-access-detail-page');

		if( a == null )
			return;

		product.asin = container.getAttribute('data-asin');

		let title = a.getAttribute('title');

		if( !title )
			return;

		product.title = title.replace(/^\[Sponsored\](.*)$/,'$1');

		let url	= this.cleanPicassoRedirect( a.getAttribute('href') );
		product.url = url;

		let seller_id  = null;
		let parameters = this.getParameters( url );

		if( parameters.has('m') )
			seller_id = parameters.get('m');

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

			if( this.getValueSelector( container, key ) == 'by' )
			{
				producer_name = this.getValueSelector( container ,pn_selectors[ key ] );
				break;
			}
		}

		////let producer_name =  this.getValueSelector(i,'.a-row.a-spacing-small > .a-row.a-spacing-none:last-of-type');
		//let producer_name =  this.getValueSelector(i,'.a-row.a-spacing-mini > .a-row.a-spacing-none:last-of-type');

		product.producer = producer_name ? producer_name.trim() : '';

		let  offersPrice = Array.from( container.querySelectorAll('a>span.a-offscreen'));

		let offers = [];

		if( seller_id )
		{
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
					,seller_id		: seller_id
				};

				if( isPrime )
					offer.is_prime = true;

				product.offers.push( offer );

				offers.push( offer );
			});
		}

		let text = cointainer.textContent.replace(/\s+/gm,' ');

		if( /only \d+ left in stock/i.test( text ) && seller_id )
		{
			let href = container.querySelector('a.s-access-detail-page');

			product.stock.push({
				qty		: text.replace(/^Only (\d+) left in stock.*/,'$1' )
				,url	: this.cleanPicassoRedirect( href.getAttribute('href') )
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
				,seller_id : seller_id
			});
		}

		if( product.offers.length && product.asin )
		{
			productsArray.push( product );
		}

		return product;
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
			let product = this.parseProduct( i );
			productsArray.push( product );
		});

		return productsArray;
	}

	hasNextPage()
	{

	}

	gotoNextPage()
	{
		//pagnNextString
		//pagnNextLink
		let a = document.querySelector('a.pagnNextLink');

		if( a )
		{
			a.click();
			return true;
		}
		return false;
	}
}
