export default class ProductUtils
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
			,is_complete: false
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

	retNumber( s )
	{
		if( typeof s === "string" )
			if( /^\d+$/.test( s ) )
				return parseInt( s, 10 );

		return s;
	}


	getDateString( date )
	{
		let fl = (i)=> i<10 ? '0'+i : i;
		let dateStr = date.getFullYear()+'-'+fl( date.getMonth()+1 )+'-'+fl( date.getDate() );

		return dateStr;
	}

	isOldProductABetterOption( op, np)
	{
		if( 'is_complete' in op && !('is_complete' in np ) )
		{
			return true;
		}

		if( 'is_complete' in np && !('is_complete' in op ) )
		{
			return false;
		}

		if('parsed' in op && 'parsed' in np && op.parsed > np.parsed )
		{
			return false;
		}

		if( 'is_complete' in op && 'is_complete' in np )
		{
			if( op.is_complete && !np.is_complete )
				return  true;

			if( !op.is_complete && np.is_complete )
				return false;
		}

		if('parsed' in op && 'parsed' in np && op.parsed < np.parsed )
		{
			return false;
		}

		return true;
	}

	mergeProducts( op, np, mergeOffersAndStock )
	{
		let iopabo = this.isOldProductABetterOption( op, np );

		let oldProduct =  iopabo ? op : np;
		let newProduct =  iopabo ? np : op;

		let keys = Object.keys( oldProduct );

		let arraysKeys	= {
			'offers'		:false
			,'stock'		:false
			,'merchants'	:false
			,'search'		:true
			,'sellers'		:true
			,'parsedDates'	:true
			,'seller_ids'	:false
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

		if( mergeOffersAndStock )
		{

			if( !('stock' in newProduct) )
				newProduct.stock = [];

			if( !('stock' in oldProduct) )
				oldProduct.stock = [];



			let pKGenerator = (stock)=>
			{
				let k = "";

				if( 'time' in stock )
				{
					k+="_"+stock.time.substring(0,15);
				}

				if( 'qty' in stock )
					k = stock.qty;

				if( "seller_id" in stock )
					k+="_"+stock.seller_id;

				return k;
			};


			let sK = {};

			let joiner = ( stock )=>
			{
				let  k = pKGenerator( stock );
				sK[ k ] = stock;
			};

			oldProduct.stock.forEach( joiner );
			newProduct.stock.forEach( joiner );

			newProduct.stock = Object.values( sK );

			if( !( 'offers' in newProduct ) )
				newProduct.offers = [];

			if( !('offers' in oldProduct)  )
				oldProduct.offers = [];

			let offerGenerator = (offer)=>
			{
				let k = '';
				if( 'time' in offer )
				{
					k += offer.time.substring(0,13);
				}
				if( 'seller_id' in offer && offer.seller_id )
				{
					k+= offer.seller_id;
				}
				if( 'price' in offer )
					k+= offer.price;

				return k;
			};

			let offersKeys = {};

			let offersJoiner = (offer)=>
			{
				let k = offerGenerator( offer );
				offersKeys[ k ] = offer;
			};

			oldProduct.offers.forEach( offersJoiner );
			newProduct.offers.forEach( offersJoiner );
			newProduct.offers = Object.values( offersKeys );
		}

		return newProduct;
	}

	cleanProductNormalize( product )
	{

	}

	getQty( qty )
	{
		if( qty == null  || qty === undefined )
			return '';

		let msg = /The item quantities were not updated since you've exceeded the maximum number of items that can be stored in the Shopping Cart/;

		if(  msg.test( qty) )
		{
			return 'Error > 990';
		}

		let regex_2 = /This seller has only \d+ of these available/;
		let regex_2_replace = /^.*This seller has only (\d+) of these available.*/;
		let regex_3 = /Only \d+ left in stock \(more on the way\)./;

		let regex_3_replace = /Only (\d+) left in stock \(more on the way\)/;

		if( qty === 'Currently unavailable.' )
		{
			return 0;
		}

		if( /^\d+$/.test( qty ) )
		{
			if( typeof qty === "number" )
				return qty;

			return parseInt( qty, 10 );
		}

		if( /Only \d+ left in stock - order soon./.test( qty ) )
		{
			return this.retNumber( qty.replace(/.*Only (\d+) left in stock - order soon.*/,'$1') );
		}

		if( regex_2.test( qty ) )
		{
			return this.retNumber( qty.replace( regex_2_replace, '$1' ) );
		}

		if( regex_3.test( qty ) )
		{
			 return this.retNumber( qty.replace( regex_3_replace, '$1' ) );
		}

		return qty;
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
