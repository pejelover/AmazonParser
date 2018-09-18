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
		let shipped	= i.querySelector('.sc-seller');

		let fullfilled_by	= null;

		let seller	= i.querySelector('.sc-seller a');

		if( seller )
			product.sellers.push( seller.textContent.trim().toLowerCase() );

		let shippedText = this.amazonParser.getValueSelector(i,'.sc-seller');

		if(shipped && /shipped From: /.test(  shipped ) && seller )
		{
			fullfilled_by = seller.textContent.trim();
		}

		let params  = new Map();

		if( link )
		{
			product.url	= link.getAttribute('href');
			params	= this.amazonParser.getParameters( product.url );
		}

		let warningMessage  = i.querySelector('.sc-quantity-update-message>.a-box.a-alert');
		let stock = null;

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

			if( params.has( 'smid' ) )
			{
				stock.seller_id =  params.get('smid');
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

			if( params.has( 'smid' ) )
			{
				stock.seller_id		= params.get('smid');
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

				if( params.get('smid') )
				{
					stock.seller_id		= params.get( 'smid' );
				}

				product.stock = [ stock ];
			}
		}

		if( product.stock.length )
		{
			if( fullfilled_by )
			{
				product.stock[0].fullfilled_by = fullfilled_by;
				product.stock[0].is_prime = false;
			}
			else
			{
				product.stock[0].is_prime = true;
			}
		}

		let price = this.amazonParser.getValueSelector(i,'span.sc-product-price');

		if( price )
		{

			if( product.stock.length  )
				product.stock[0].price = price;

			let offer = {
				price	: price
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
			};

			if( fullfilled_by )
			{
				offer.fullfilled_by = fullfilled_by;
			}

			if( 'seller' in product )
			{
				offer.seller		= product.seller;
				offer.seller_url	= seller.getAttribute('href');
			}

			if( params.has( 'smid' ) )
			{
				offer.seller_id = params.get( 'smid' );
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

		let generator = (div, index)=>
		{
			//let z = i.querySelector('select[name="quantity"].a-native-dropdown');

			div.setAttribute("style","background-color: #ddddff");

			let product = this.parseProductItem( div );

			if( product.stock.length )
			{
				return Promise.resolve( product, 1200 )
				.then((p)=>
				{
					let input = div.querySelector('span.sc-action-delete>span input');
					if( input )
					{
						input.click();
						return Promise.resolve( p );
					}

					//Send Product to database
					let x = div.querySelector('span.sc-action-delete>span');

					if( x )
						x.click();

					return Promise.resolve( p );
				});
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

					return it.stock.length > 0 ? it : false;

				},250,14).catch((eee)=>
				{
					return Promise.reject('It fails to get the message '+('msg' in eee ? eee['msg']: eee ) );
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
				console.log(perror );
				return Promise.resolve( null );
			});
		};

		return PromiseUtils.runSequential( items, generator );
	}
}
