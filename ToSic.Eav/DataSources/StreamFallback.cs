﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace ToSic.Eav.DataSources
{
	/// <summary>
	/// A DataSource that filters Entities by Ids
	/// </summary>
	[PipelineDesigner]
	public class StreamFallback : BaseDataSource
	{
		#region Configuration-properties (no config)

		#endregion

        #region Debug-Properties

	    public string ReturnedStreamName { get; private set; }
        #endregion


        /// <summary>
		/// Constructs a new EntityIdFilter
		/// </summary>
		public StreamFallback()
		{
			Out.Add(DataSource.DefaultStreamName, new DataStream(this, DataSource.DefaultStreamName, GetEntities, GetList));
		}

		private IDictionary<int, IEntity> GetEntities()
		{
		    var foundStream = FindIdealFallbackStream();

		    return foundStream != null ? foundStream.List : new Dictionary<int, IEntity>();
		}


        private IEnumerable<IEntity> GetList()
        {
            var foundStream = FindIdealFallbackStream();

            return foundStream != null ? (foundStream as IDataStreamLight).List : new List<IEntity>();
        }

	    private IDataStream FindIdealFallbackStream()
	    {
            EnsureConfigurationIsLoaded();

            // Check if there is a default-stream in with content - if yes, try to return that
	        if (In.ContainsKey(DataSource.DefaultStreamName) && In[DataSource.DefaultStreamName].List.Any())
	            return In[DataSource.DefaultStreamName];

	        // Otherwise alphabetically assemble the remaining in-streams, try to return those that have content
	        var streamList = In.Where(x => x.Key != DataSource.DefaultStreamName).OrderBy(x => x.Key);
	        foreach (var stream in streamList)
	            if (stream.Value.List.Any())
	            {
	                ReturnedStreamName = stream.Key;
	                return stream.Value;
	            }
	        return null;
	    }
	}
}