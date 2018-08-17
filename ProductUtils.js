class ProductUtils
{
	constructor( options )
	{
		this.date	= new Date();
		this.date.setSeconds( 0 );
		this.date.setMilliseconds( 0 );
	}

	createNewProductObject()
	{
		return {

			images	: []
			,offers	: []
			,sellers : []
			,seller_ids: []
			,search		: []
			,stock	: []
			,parsed	: this.date.toISOString()
			,parsedDates:[ this.getDateString( this.date ) ]
			,versions	: []
		};
	}



	getDate()
	{
		return this.getDateString( this.date );
	}

	getTime()
	{
		return this.date.toISOString();
	}


	getDateString( date )
	{
		let fl = (i)=> i<10 ? '0'+i : i;
		let dateStr = date.getFullYear()+'-'+fl( date.getMonth()+1 )+'-'+fl( date.getDate() );

		return dateStr;
	}

	mergeProducts( op, np )
	{
		let isOpOldProduct = true;

		if('parsed' in op && 'parsed' in np && op.parsed > np.parsed )
		{
			isOpOldProduct = false;
		}

		let oldProduct =  isOpOldProduct ? op : np;
		let newProduct =  isOpOldProduct ? np : op;

		let keys = Object.keys( oldProduct );

		let arraysKeys	= {
			'offers'		:false
			,'stock'		:false
			,'merchants'	:false
			,'search'		:true
			,'sellers'		:true
			,'parsedDates'	:true
			,'seller_ids'	:true
		};

		keys.forEach((k)=>
		{
			if( k in arraysKeys )
			{
				if( arraysKeys[ k ] )
				{
					this.overlapingInfo( oldProduct[ k ], newProduct[ k ], null, (element,isOverlap )=>
					{
						if( !isOverlap )
							newProduct[ k ].push( element );
					});
				}
				return;
			}

			if( (k in newProduct && newProduct[ k ] ) || k in arraysKeys  )
				return;

			newProduct[ k ] = oldProduct[ k ];
		});

		if( !newProduct.stock )
			newProduct.stock = [];

		this.overlapingInfo
		(
			oldProduct.stock
			,newProduct.stock
			,(stock)=>
			{
				let k = "";

				if( qty in stock )
					k = qty;

				if( "seller_id" in stock )
					k+="_"+seller_id;

				if( 'time' in stock )
				{
					k+="_"+stock.time.substring(0,13);
				}

				return k;
			}
			, (element,isOverlap)=>
			{
				if( !isOverlap )
					newProduct.stock.push( element );
			}
		);

		if( !newProduct.offers )
			newProduct.offers = [];

		this.overlapingInfo(
			oldProduct.offers
			,newProduct.offers
			,(offer)=>
			{
				return offer.price+' '+offer.time+' '+offer.sellerName+' '+( offer.is_prime ? 'prime' :'' )+( 'condition' in offer ? ' '+offer.condition : 'New' );
			}
			,(offer, isOverlap)=>
			{
				if( 'qid' in offer )
				{
					delete  offer.qid;
				}

				if( !isOverlap )
				{
					newProduct.offers.push( offer );
				}
			}
		);

		return newProduct;
	}

	cleanProductNormalize( product )
	{
		if( 'offers' in product )
		{
			if( !('sellers' in product ) )
			{
				product.sellers = [];
			}


			product.offers.forEach((offer )=>
			{
				if( 'add2CarSelector' in offer )
				{
					delete offer.add2CarSelector;
				}

				if( 'seller' in offer )
				{
					product.sellers.push( offer.seller.toLowerCase() );
				}
				if( 'seller_id' in offer )
				{
					product.seller_ids.push( offer.seller_id );
				}
			});
		}

		if( 'seller_ids' in product )
		{
			let kSellers = {};
			product.seller_ids.forEach(i=>kSellers[i]=1);
			product.seller_ids = Object.keys( kSellers );
		}

		if( 'sellers' in product )
		{
			let kSellers = {};
			product.sellers.forEach(i=>kSellers[i]=1);
			product.sellers = Object.keys( kSellers );
		}

		if( 'qids' in product )
		{
			delete product.qids;
		}

		if( !( 'offers' in product) )
			product.offers  = [];

		if( 'time' in product )
		{
			if( 'parsed' in product )
			{
				product.parsed = product.time;
				delete product.time;
			}
		}

		if( 'dateParsed' in product )
		{
			if( !( 'parsed' in product ) )
			{
				let x = new Date( product.dateParsed );
				product.parsed = x.toISOString();
			}

			delete product.dateParsed;
		}

		if( 'stock' in product )
		{
			product.stock.forEach((stock)=>
			{
				if( /Only \d+ left in stock - order soon./.test( stock.qty ) )
				{
					stock.qty = stock.qty.replace(/^.*Only (\d+) left in stock - order soon.*$/,'$1');
				}
			});
		}
		else
		{
			product.stock = [];
		}
	}

	overlapingInfo( from, to,key ,lambda )
	{
		if( !from || !to  )
			return;

		let aKeys	= {};

		let isFunc  = typeof key === "function";

		if( key == null )
		{
			to.forEach( i => aKeys[ i ] = 1 );

			from.forEach((i)=>
			{
				lambda( i, i in aKeys );

			});
		}
		else
		{
			to.forEach((i)=>
			{
				aKeys[ isFunc ? key( i ) : to[ key ] ] = i;
			});

			from.forEach((i)=>
			{
				let bKey = isFunc ? key( i ) : from[ key ];
				lambda( i, bKey in aKeys );
			});
		}
	}

}
