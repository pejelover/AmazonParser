class CartPage
{
	constructor(amazonParser, productUtils )
	{
		this.amazonParser = amazonParser;
		this.productUtils = productUtils;
	}


	executeProcessOnItem(asin)
	{

	}

	deleteItemsWithStock( products )
	{
		let p = Array.isArray( products ) ? products : this.getProducts();

		let pWithStock = p.filter( i => i.stock.length> 0 );

		let generator = (product, index)=>
		{
			let selector = 'div[data-asin="'+product.asin+'"]  span.sc-action-delete>span';
			//console.log( selector );
			let input  = document.querySelector( selector );

			if( input )
			{
				input.click();
			}

			return PromiseUtils.resolveAfter(1, 500 );
		};

		return PromiseUtils.runSequential( pWithStock, generator );
	}

	parseProductItem( i )
	{
		//console.log( i );

		let product		= this.productUtils.createNewProductObject();
		product.asin	= i.getAttribute('data-asin');

		let link	= i.querySelector('a.sc-product-link');

		let seller	= i.querySelector('.sc-seller a');

		if( seller )
			product.sellers.push( seller.textContent.trim().toLowerCase() );

		let params  = {};

		if( link )
		{
			product.url	= link.getAttribute('href');
			params	= this.amazonParser.getParameters( product.url );
		}

		let warningMessage  = i.querySelector('.sc-quantity-update-message>.a-box.a-alert');

		if( warningMessage )
		{
			let text	= warningMessage.textContent.trim().replace(/\s+/g,' ');
			text 		= text.replace(/^only (\d+) left in stock.*$/i,'$1');
			text		= text.replace(/^This seller has only (\d+) of these available. *$/,'$1');

			let stock	= {
				qty		: text
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
				,asin	: product.asin
			};

			if( 'smid' in params )
			{
				stock.seller_id =  params.smid;
			}

			if( 'seller' in product )
			{
				stock.seller		= product.sellers[0];
				stock.seller_url	= seller.getAttribute('href');
			}

			product.stock = [ stock ];
		}

		let qtyStr 	= this.amazonParser.getValueSelector(i,'.sc-product-scarcity');

		if( qtyStr && /^Only (\d+) left in stock/.test( qtyStr ) )
		{
			let stock	= {
				qty	: qtyStr.replace(/^only (\d+) left in stock.*$/i,'$1')
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
				,asin	: product.asin
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

		if( product.stock.length == 0 )
		{
			if( i.getAttribute('data-quantity') === '999' )
			{
				let stock	= {
					qty	: 999
					,date	: this.productUtils.getDate()
					,time	: this.productUtils.getTime()
					,asin	: product.asin
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
		}

		let price = this.amazonParser.getValueSelector(i,'span.sc-product-price');

		if( price )
		{
			let offer = {
				price	: price
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
			};

			if( 'seller' in product )
			{
				offer.seller		= product.seller;
				offer.seller_url	= seller.getAttribute('href');
			}

			if( 'smid' in params )
			{
				offer.seller_id = params.smid;
			}

			product.offers = [ offer ];
		}

		return product;
	}

	getItemsSelector()
	{
		return '.sc-list-body[data-name="Active Items"] div[data-asin]:not([data-removed="true"])';
	}

	getProducts()
	{
		let form = document.querySelector('#activeCartViewForm');

		let itemsNodeList = form.querySelectorAll( this.getItemsSelector() );
		let items	= Array.from( itemsNodeList );
		let productsArray	= [];

		items.forEach((i)=> productsArray.push( this.parseProductItem( i ) ) );

		return productsArray;
	}

	/*
	 * requires a client from extension-framework/
	 */
	parseAllTheStock( client )
	{
		let form = document.querySelector('#activeCartViewForm');

		let itemsNodeList = form.querySelectorAll( this.getItemsSelector() );
		let items	= Array.from( itemsNodeList );

		let generator = ( items, (div, index)=>
		{
			//let z = i.querySelector('select[name="quantity"].a-native-dropdown');

			div.setAttribute("style","background-color: #ddddff");

			let product = this.parseProductItem( div );

			if( product.stock.length )
			{
				//Send Product to database
				let x = div.querySelector('span.sc-action-delete t cinput[value="Delete"]');
				if( x )
					x.click();

				return PromiseUtils.resolveAfter( product, 1200 );
			}

			//The select Button  with label +1
			let z = div.querySelector('[data-action="a-dropdown-button"]');

			if( z )
				z.click();

			//Wait to show dropdown "select"
			return client.waitTillElementReady(div,'span.a-dropdown-prompt')
			.then(()=>
			{
				return PromiseUtils.resolveAfter( 1, 500 );
			})
			.then(()=>
			{
				//CLick on the dropdown
				let x = div.querySelector('span.a-dropdown-prompt');
                x.click();

				return client.waitTillReady( 'div.a-popover.a-dropdown-common[aria-hidden="false"] li:last-child a');
			})
			.then(()=>
			{
				return PromiseUtils.resolveAfter( 1, 1000 );
			})
			.then(()=>
			{
				//Wait select  button with label 10+
				let x = document.querySelector('div.a-popover.a-dropdown-common[aria-hidden="false"] li:last-child a');
				if( x )
					x.click();


				//Wait for the input to appear
                return client.waitTillElementReady(div,'input[name="quantityBox"][aria-label="Quantity"]',false);
			})
			.then(()=>
			{
				//Changin the quantity of the input to 999
				let input = div.querySelector('input[name="quantityBox"][aria-label="Quantity"]');

				if( input )
				{
					input.value = 999;
					let inputEvent = new Event('input',
					{
						"bubbles"	   : true
						,"cancelable"   : false
						,"composed"	 : false
					});

					input.dispatchEvent( inputEvent );
				}
				//Wait to the update button to update the qty input
				return client.waitTillElementReady(div,'a[data-action="update"]',false);
			})
			.then(()=>
			{
				//Click on the update button
				let a =  div.querySelector('a[data-action="update"]');

				if( a == null  )
				{
					return Promise.reject('A button to update not found');
				}

				a.click();

				return PromiseUtils.tryNTimes(()=>
				{
					let asin = div.getAttribute('data-asin');
					let nDiv = document.querySelector('.sc-list-body[data-name="Active Items"]>div[data-asin="'+asin+'"]');
					let it = this.parseProductItem( nDiv );
					//console.log( it );
					//console.log( i );
					//let e = i.querySelector('.sc-quantity-update-message.a-spacing-top-mini');
					//console.log( e );
					//return e !== null;
					return it.stock.length > 0 ? it : false;

				},250,14).catch((eee)=>
				{
					return Promise.reject('It fails to get the message',eee);
				});
			})
			.then(( product1 )=>
			{
				//console.log( product1 );

				if( product1 )
					client.executeOnBackground('StockFound', product1.stock );

				let nDiv = document.querySelector('.sc-list-body[data-name="Active Items"]>div[data-asin="'+product1.asin +'"]');
				product = this.parseProductItem( nDiv );
				//console.log( product );

				if( product.stock.length )
				{
					//Sen
					let x = nDiv.querySelector('span.sc-action-delete>span');
					x.click();

					return PromiseUtils.resolveAfter( product, 300 );
				}
				else
				{
					nDiv.setAttribute('style','background-color:red');
					return Promise.resolve( null );
				}
			})
			.catch((perror)=>
			{
				console.log('It fails on item',perror );
				return Promise.resolve( null );
			});
		});

		return PromiseUtils.runSequential( items, generator );
	}
}
