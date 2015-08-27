﻿using System.Collections.Generic;

namespace ToSic.Eav
{
	/// <summary>
	/// Represents a Content Type
	/// </summary>
	public interface IContentType
	{
		/// <summary>
		/// Gets the Display Name of the Content Type
		/// </summary>
		string Name { get; }
		/// <summary>
		/// Gets the Static Name of the Content Type
		/// </summary>
		string StaticName { get; }

        /// <summary>
        /// The content-type description
        /// </summary>
        string Description { get; }
        /// <summary>
        /// Get the id of the Content Type (AttributeSet)
        /// </summary>
        int AttributeSetId { get; }

        /// <summary>
        /// Dictionary with all Attribute Definitions
        /// </summary>
        IDictionary<int, IAttributeBase> AttributeDefinitions { get; set; }

        /// <summary>
        /// Get the scope of the Content Type
        /// </summary>
        string Scope { get; }
        /// <summary>
        /// Get the id of the source Content Type if configuration is used from another
        /// </summary>
        int? UsesConfigurationOfAttributeSet { get; }
	}
}