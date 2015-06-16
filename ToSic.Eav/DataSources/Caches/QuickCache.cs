﻿using System;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using ToSic.Eav.Data;

// new 2015-06-14 for caching
using System.Runtime.Caching;

namespace ToSic.Eav.DataSources.Caches
{
	/// <summary>
	/// simple, quick cache
	/// </summary>
	public class QuickCache : BaseCache, IListCache
	{
		private static Dictionary<int, Data.Zone> _zoneApps;

		public QuickCache()
		{
			Cache = this;
		}

		public override Dictionary<int, Data.Zone> ZoneApps
		{
			get { return _zoneApps; }
			protected set { _zoneApps = value; }
		}

		private static Dictionary<int, string> _assignmentObjectTypes;
		public override Dictionary<int, string> AssignmentObjectTypes
		{
			get { return _assignmentObjectTypes; }
			protected set { _assignmentObjectTypes = value; }
		}

		private const string _cacheKeySchema = "Z{0}A{1}";
		public override string CacheKeySchema { get { return _cacheKeySchema; } }


        #region The cache-variable + HasCacheItem, SetCacheItem, Get, Remove
        private static readonly IDictionary<string, CacheItem> Caches = new Dictionary<string, CacheItem>();


		protected override bool HasCacheItem(string cacheKey)
		{
			return Caches.ContainsKey(cacheKey);
		}

		protected override void SetCacheItem(string cacheKey, CacheItem item)
		{
			Caches[cacheKey] = item;
		}

		protected override CacheItem GetCacheItem(string cacheKey)
		{
			return Caches[cacheKey];
		}

		protected override void RemoveCacheItem(string cacheKey)
		{
			Caches.Remove(cacheKey);	// returns false if key was not found (no Exception)
        }
        #endregion

        #region BETA Additional Stream Caching

	    private ObjectCache ListCache
	    {
	        get { return MemoryCache.Default; }
	    }

        public bool HasList(string key)
        {
            return ListCache.Contains(key);
        }
        /// <summary>
        /// Get a DataStream in the cache - will be null if not found
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        public IEnumerable<IEntity> GetList(string key)
	    {
            var ds = ListCache[key] as IEnumerable<IEntity>;
	        return ds;
	    }

        /// <summary>
        /// Insert a data-stream to the cache - if it can be found
        /// </summary>
        /// <param name="key"></param>
        /// <param name="list"></param>
        public void SetList(string key, IEnumerable<IEntity> list)
	    {
	        var policy = new CacheItemPolicy();
	        policy.SlidingExpiration = new TimeSpan(1, 0, 0); // 1 hour
	        var cache = MemoryCache.Default;
            cache.Set(key, list, policy);
	    }

        public void RemoveList(string key)
        {
            var cache = MemoryCache.Default;
            cache.Remove(key);
        }
        #endregion
    }
}